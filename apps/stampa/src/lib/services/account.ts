/**
 * Export and deletion (tickets T-05, T-06).
 *
 * Retention rules are stated in plain language on screen and enforced here:
 * stamped invoices are tax records and survive, unlinked from the account.
 * Everything else goes.
 */
import { and, eq, inArray, isNotNull, isNull, lte, or } from "drizzle-orm";
import { getDb } from "../db/client";
import { invoices, suppliers, supplierLinks, sessions, transmissions } from "../db/schema";
import { writeAudit } from "../audit";
import { formatKobo, kobo } from "../money";
import { formatDateTime } from "../copy";
import { toCsv } from "../csv";

/** How long a deleted account keeps its identifying fields, so it can be recovered. */
export const HARD_DELETE_AFTER_DAYS = 30;

/** What a purged supplier row is called once it names nobody. */
export const DELETED_BUSINESS_NAME = "Deleted account";

/** CSV of everything, offered before deletion and at any time. */
export async function exportInvoicesCsv(supplierId: string): Promise<string> {
  const db = await getDb();
  const rows = await db.query.invoices.findMany({
    where: eq(invoices.supplierId, supplierId),
    with: { organisation: true, lines: true },
  });

  const header = [
    "Invoice number",
    "Customer",
    "Description",
    "Quantity",
    "Unit price",
    "Subtotal",
    "VAT",
    "Total",
    "Status",
    "NRS reference",
    "Stamped at",
  ];

  return toCsv(
    header,
    rows.map((row) => [
      row.invoiceNumber,
      row.organisation.legalName,
      row.lines.map((line) => line.description).join("; "),
      row.lines.reduce((sum, line) => sum + line.quantity, 0),
      formatKobo(kobo(row.lines[0]?.unitPriceKobo ?? 0)),
      formatKobo(kobo(row.subtotalKobo)),
      formatKobo(kobo(row.vatKobo)),
      formatKobo(kobo(row.totalKobo)),
      row.status,
      row.irn ?? "",
      row.stampedAt ? formatDateTime(row.stampedAt) : "",
    ]),
  );
}

export type DeletionCheck = { allowed: true } | { allowed: false; reason: "pending_transmission" };

/**
 * Deletion is blocked while anything is in flight. Cutting the account loose
 * mid-transmission would leave a tax record with no owner and a supplier with
 * no proof.
 */
export async function canDelete(supplierId: string): Promise<DeletionCheck> {
  const db = await getDb();
  const pending = await db
    .select({ id: invoices.id })
    .from(invoices)
    .where(
      and(
        eq(invoices.supplierId, supplierId),
        or(eq(invoices.status, "queued"), eq(invoices.status, "sending")),
      ),
    )
    .limit(1);

  return pending.length ? { allowed: false, reason: "pending_transmission" } : { allowed: true };
}

/**
 * Soft delete now, hard delete after 30 days. Drafts and contact details go
 * immediately; stamped invoices are unlinked rather than removed.
 */
export async function softDeleteAccount(supplierId: string): Promise<void> {
  const db = await getDb();
  const check = await canDelete(supplierId);
  if (!check.allowed) throw new Error("Cannot delete while a transmission is pending");

  const drafts = await db
    .select({ id: invoices.id })
    .from(invoices)
    .where(and(eq(invoices.supplierId, supplierId), eq(invoices.status, "draft")));

  if (drafts.length) {
    const ids = drafts.map((row) => row.id);
    await db.delete(transmissions).where(inArray(transmissions.invoiceId, ids));
    await db.delete(invoices).where(inArray(invoices.id, ids));
  }

  await db
    .update(suppliers)
    .set({ deletedAt: new Date(), address: "" })
    .where(eq(suppliers.id, supplierId));


  await db
    .update(supplierLinks)
    .set({ status: "deleted" })
    .where(eq(supplierLinks.supplierId, supplierId));

  await db
    .update(sessions)
    .set({ revokedAt: new Date() })
    .where(and(eq(sessions.subjectId, supplierId), isNull(sessions.revokedAt)));

  await writeAudit(db, {
    actor: { type: "supplier", id: supplierId },
    action: "account.deleted",
    subjectType: "supplier",
    subjectId: supplierId,
    after: { draftsRemoved: drafts.length, hardDeleteAfterDays: HARD_DELETE_AFTER_DAYS },
  });
}

/**
 * The other half of deletion, and the half that is easy to never write.
 *
 * `softDeleteAccount` audits a promise that the identifying fields will be
 * gone in thirty days. This is what keeps it. Run it daily — `npm run purge`.
 *
 * The supplier row survives being purged. Stamped invoices are tax records
 * that outlive the account by law, and their foreign key has to resolve to
 * something; what it resolves to afterwards is a row that no longer names
 * anybody. The phone column is `NOT NULL` and uniquely indexed, so it takes a
 * per-row tombstone rather than a null.
 */
export async function purgeDeletedAccounts(now: Date = new Date()): Promise<number> {
  const db = await getDb();
  const cutoff = new Date(now.getTime() - HARD_DELETE_AFTER_DAYS * 24 * 60 * 60 * 1000);

  const due = await db
    .select({ id: suppliers.id })
    .from(suppliers)
    .where(
      and(
        isNotNull(suppliers.deletedAt),
        isNull(suppliers.purgedAt),
        lte(suppliers.deletedAt, cutoff),
      ),
    );

  for (const { id } of due) {
    await db
      .update(suppliers)
      .set({
        businessName: DELETED_BUSINESS_NAME,
        phone: `deleted:${id}`,
        tin: null,
        address: "",
        purgedAt: now,
      })
      .where(eq(suppliers.id, id));

    await writeAudit(db, {
      actor: { type: "system", id: "purge" },
      action: "account.purged",
      subjectType: "supplier",
      subjectId: id,
      after: { afterDays: HARD_DELETE_AFTER_DAYS },
    });
  }

  return due.length;
}
