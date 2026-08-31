/**
 * Buyer console services (tickets B-01..B-08).
 *
 * The exposure calculation in here is the wedge. It is the screenshot a
 * Financial Controller forwards, so every figure it produces has to be
 * traceable to something the buyer gave us.
 */
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "../db/client";
import { invitations, invoices, organisations, supplierLinks, suppliers } from "../db/schema";
import { inviteCode, newId } from "../ids";
import { writeAudit, type Actor } from "../audit";
import { track } from "../analytics";
import { addKobo, applyBasisPoints, formatKobo, kobo, ZERO, type Kobo } from "../money";
import { STANDARD_VAT_BASIS_POINTS } from "../vat";
import { copy, formatDateTime } from "../copy";
import { toCsv } from "../csv";
import { sendWithFallback } from "../messaging";
import { appUrl } from "./notify";
import { createInvitationFor } from "./onboarding";
import type { ParsedVendor } from "./vendor-master";

/**
 * Used only when the buyer's export carried no spend column. It is stated on
 * screen whenever it is used, never folded silently into the headline.
 */
export const ASSUMED_ANNUAL_SPEND_KOBO = kobo(20_000_000_00);

export type ImportSummary = {
  created: number;
  updated: number;
  bankChanges: number;
};

/**
 * Persist an ingested vendor master.
 *
 * Bank fields are written here and only here, and every change is diffed and
 * audited. This is the sole path in the codebase that touches them, which is
 * what makes the column-level revocation elsewhere meaningful.
 */
export async function importVendors(
  organisationId: string,
  vendors: ParsedVendor[],
  actor: Actor,
): Promise<ImportSummary> {
  const db = await getDb();
  const summary: ImportSummary = { created: 0, updated: 0, bankChanges: 0 };

  for (const vendor of vendors) {
    let supplier = await db.query.suppliers.findFirst({
      where: eq(suppliers.phone, vendor.phone),
    });

    if (!supplier) {
      const id = newId("sup");
      [supplier] = await db
        .insert(suppliers)
        .values({
          id,
          businessName: vendor.businessName,
          tin: vendor.tin,
          address: vendor.address,
          phone: vendor.phone,
        })
        .returning();
      summary.created += 1;
      await writeAudit(db, {
        actor,
        action: "supplier.created",
        subjectType: "supplier",
        subjectId: id,
        after: { businessName: vendor.businessName, source: "vendor_master" },
      });
    } else if (!supplier.confirmedAt) {
      // Only overwrite details the supplier has not confirmed themselves.
      await db
        .update(suppliers)
        .set({
          businessName: vendor.businessName,
          tin: vendor.tin ?? supplier.tin,
          address: vendor.address || supplier.address,
        })
        .where(eq(suppliers.id, supplier.id));
      summary.updated += 1;
    }

    const existingLink = await db.query.supplierLinks.findFirst({
      where: and(
        eq(supplierLinks.supplierId, supplier.id),
        eq(supplierLinks.organisationId, organisationId),
      ),
    });

    const bankChanged =
      existingLink !== undefined &&
      (existingLink.bankName !== vendor.bankName || existingLink.bankLast4 !== vendor.bankLast4);

    if (!existingLink) {
      await db.insert(supplierLinks).values({
        id: newId("lnk"),
        supplierId: supplier.id,
        organisationId,
        vendorCode: vendor.vendorCode,
        category: vendor.category,
        bankName: vendor.bankName,
        bankLast4: vendor.bankLast4,
        status: "imported",
      });
    } else {
      await db
        .update(supplierLinks)
        .set({
          vendorCode: vendor.vendorCode ?? existingLink.vendorCode,
          category: vendor.category ?? existingLink.category,
          bankName: vendor.bankName,
          bankLast4: vendor.bankLast4,
          annualSpendKobo: vendor.annualSpendKobo ?? existingLink.annualSpendKobo,
        })
        .where(eq(supplierLinks.id, existingLink.id));

      if (bankChanged) {
        summary.bankChanges += 1;
        await writeAudit(db, {
          actor,
          action: "supplier_link.bank_updated",
          subjectType: "supplier_link",
          subjectId: existingLink.id,
          before: { bankName: existingLink.bankName, bankLast4: existingLink.bankLast4 },
          after: { bankName: vendor.bankName, bankLast4: vendor.bankLast4 },
        });
      }
    }
  }

  return summary;
}

export type Exposure = {
  totalVendors: number;
  exposedVendors: number;
  compliantVendors: number;
  uncheckableVendors: number;
  vatAtRiskKobo: Kobo;
  spendSource: "buyer_data" | "assumption";
  /**
   * When the vendor master this was computed from was loaded.
   *
   * The report states its own provenance, so the date has to be the real one.
   * The first version passed `new Date()` into a line that reads "based on 6
   * vendors uploaded on …", which told a Financial Controller their four-month
   * old list was uploaded this morning.
   */
  vendorsLoadedAt: Date | null;
};

/**
 * Input VAT at risk this quarter, from vendors that have never transmitted a
 * compliant invoice.
 *
 * A vendor with no TIN is counted as uncheckable, not as exposed. Inflating
 * the headline with rows we could not actually check would make the number
 * indefensible the first time a Financial Controller audited it, and this
 * number only works if it survives being forwarded.
 */
export async function computeExposure(organisationId: string, actor: Actor): Promise<Exposure> {
  const db = await getDb();

  const links = await db.query.supplierLinks.findMany({
    where: eq(supplierLinks.organisationId, organisationId),
    with: { supplier: true },
  });

  const stamped = await db
    .selectDistinct({ supplierId: invoices.supplierId })
    .from(invoices)
    .where(and(eq(invoices.organisationId, organisationId), eq(invoices.status, "stamped")));
  const compliantIds = new Set(stamped.map((row) => row.supplierId));

  let exposedVendors = 0;
  let compliantVendors = 0;
  let uncheckableVendors = 0;
  let annualSpend = ZERO;
  // Flips the moment any exposed vendor carries a figure from their own file.
  let spendSource: Exposure["spendSource"] = "assumption";

  for (const link of links) {
    if (!link.supplier.tin) {
      uncheckableVendors += 1;
      continue;
    }
    if (compliantIds.has(link.supplierId)) {
      compliantVendors += 1;
      continue;
    }
    exposedVendors += 1;
    if (link.annualSpendKobo !== null) {
      spendSource = "buyer_data";
      annualSpend = addKobo(annualSpend, kobo(link.annualSpendKobo));
    } else {
      annualSpend = addKobo(annualSpend, ASSUMED_ANNUAL_SPEND_KOBO);
    }
  }

  // A quarter of the annual spend, at the standard rate.
  const quarterlySpend = kobo(Math.round(annualSpend / 4));
  const vatAtRiskKobo = applyBasisPoints(quarterlySpend, STANDARD_VAT_BASIS_POINTS);

  await track(db, "buyer_exposure_computed", actor, {
    vendorCount: links.length,
    exposedCount: exposedVendors,
    uncheckableCount: uncheckableVendors,
    spendSource,
  });

  // The most recent row wins: re-uploading a vendor master is how bank details
  // change, so the newest import is the one the numbers actually reflect.
  const loadedAt = links.reduce<Date | null>(
    (latest, link) => (!latest || link.createdAt > latest ? link.createdAt : latest),
    null,
  );

  return {
    totalVendors: links.length,
    exposedVendors,
    compliantVendors,
    uncheckableVendors,
    vatAtRiskKobo,
    spendSource,
    vendorsLoadedAt: loadedAt,
  };
}

export type SupplierRow = {
  linkId: string;
  supplierId: string;
  businessName: string;
  phone: string;
  tin: string | null;
  vendorCode: string | null;
  status: string;
  inviteCode: string | null;
  stampedCount: number;
};

export async function listSuppliers(organisationId: string): Promise<SupplierRow[]> {
  const db = await getDb();

  const links = await db.query.supplierLinks.findMany({
    where: eq(supplierLinks.organisationId, organisationId),
    with: { supplier: true, invitations: true },
    orderBy: desc(supplierLinks.createdAt),
  });

  const counts = await db
    .select({ supplierId: invoices.supplierId, count: sql<number>`count(*)::int` })
    .from(invoices)
    .where(and(eq(invoices.organisationId, organisationId), eq(invoices.status, "stamped")))
    .groupBy(invoices.supplierId);
  const byId = new Map(counts.map((row) => [row.supplierId, row.count]));

  return links.map((link) => ({
    linkId: link.id,
    supplierId: link.supplierId,
    businessName: link.supplier.businessName,
    phone: link.supplier.phone,
    tin: link.supplier.tin,
    vendorCode: link.vendorCode,
    status: link.status,
    inviteCode: link.invitations.at(-1)?.code ?? null,
    stampedCount: byId.get(link.supplierId) ?? 0,
  }));
}

export type InviteOutcome = { linkId: string; sent: boolean; code?: string; problem?: string };

/**
 * Invitations go out in the buyer's name over WhatsApp with SMS behind it, and
 * results are reported per recipient. A blanket "some failed" would leave an
 * AP clerk with no idea which vendor to chase.
 */
export async function sendInvitations(
  organisationId: string,
  linkIds: string[],
  actor: Actor,
): Promise<InviteOutcome[]> {
  const db = await getDb();
  const organisation = await db.query.organisations.findFirst({
    where: eq(organisations.id, organisationId),
  });
  if (!organisation) throw new Error("Organisation not found");

  const links = await db.query.supplierLinks.findMany({
    where: and(
      eq(supplierLinks.organisationId, organisationId),
      inArray(supplierLinks.id, linkIds),
    ),
    with: { supplier: true },
  });

  const outcomes: InviteOutcome[] = [];

  for (const link of links) {
    const code = inviteCode(organisation.inviteSlug);
    const url = appUrl(`/s/i/${code}`);

    // The invitation record is written first. A supplier who receives the
    // message on a flaky delivery report and taps it must find a live link.
    await createInvitationFor(link.id, code, "whatsapp");

    const result = await sendWithFallback({
      to: link.supplier.phone,
      template: "buyer_invite",
      body: copy.buyer.inviteMessage(organisation.legalName, url),
      link: url,
    });

    await writeAudit(db, {
      actor,
      action: "invitation.sent",
      subjectType: "supplier_link",
      subjectId: link.id,
      after: { channel: result.channel, delivered: result.ok },
    });

    outcomes.push(
      result.ok
        ? { linkId: link.id, sent: true, code }
        : { linkId: link.id, sent: false, problem: result.problem },
    );
  }

  await track(db, "buyer_invites_sent", actor, {
    count: outcomes.filter((outcome) => outcome.sent).length,
  });

  return outcomes;
}

/**
 * Manual chase from the console (ticket B-06). Distinct from the automatic
 * day-3 nudge, which is deduplicated: this one is a person deciding to chase a
 * named vendor, and it is audited under their name.
 */
export async function nudgeSupplier(
  organisationId: string,
  linkId: string,
  actor: Actor,
): Promise<InviteOutcome> {
  const db = await getDb();
  const link = await db.query.supplierLinks.findFirst({
    where: and(eq(supplierLinks.id, linkId), eq(supplierLinks.organisationId, organisationId)),
    with: { supplier: true, organisation: true, invitations: true },
  });
  if (!link) throw new Error("Supplier link not found");

  const latest = link.invitations.at(-1);
  const code = latest?.code ?? inviteCode(link.organisation.inviteSlug);
  if (!latest) await createInvitationFor(link.id, code, "whatsapp");

  const url = appUrl(`/s/i/${code}`);
  const result = await sendWithFallback({
    to: link.supplier.phone,
    template: "buyer_nudge",
    body: copy.buyer.inviteMessage(link.organisation.legalName, url),
    link: url,
  });

  await writeAudit(db, {
    actor,
    action: "invitation.nudged",
    subjectType: "supplier_link",
    subjectId: link.id,
    after: { channel: result.channel, delivered: result.ok },
  });

  return result.ok
    ? { linkId: link.id, sent: true, code }
    : { linkId: link.id, sent: false, problem: result.problem };
}

export async function getOrganisation(organisationId: string) {
  const db = await getDb();
  return db.query.organisations.findFirst({ where: eq(organisations.id, organisationId) });
}

/** One vendor, everything the AP clerk needs before they pick up the phone. */
export async function getSupplierLink(organisationId: string, linkId: string) {
  const db = await getDb();
  const link = await db.query.supplierLinks.findFirst({
    where: and(eq(supplierLinks.id, linkId), eq(supplierLinks.organisationId, organisationId)),
    with: { supplier: true, invitations: true, organisation: true },
  });
  if (!link) return null;

  const rows = await db.query.invoices.findMany({
    where: and(
      eq(invoices.supplierId, link.supplierId),
      eq(invoices.organisationId, organisationId),
    ),
    orderBy: desc(invoices.createdAt),
    limit: 50,
  });

  return { link, invoices: rows };
}

/**
 * CSV of every stamped invoice from this buyer's suppliers, for the VAT return
 * (ticket B-07). The IRN is the column that makes the row claimable, so it is
 * not optional and not last.
 */
export async function exportInboundCsv(organisationId: string): Promise<string> {
  const db = await getDb();
  const rows = await db.query.invoices.findMany({
    where: and(eq(invoices.organisationId, organisationId), eq(invoices.status, "stamped")),
    with: { supplier: true },
    orderBy: desc(invoices.stampedAt),
  });

  return toCsv(
    [
      "NRS reference",
      "Invoice number",
      "Supplier",
      "Supplier TIN",
      "Subtotal",
      "VAT",
      "Total",
      "Stamped at",
    ],
    rows.map((row) => [
      row.irn ?? "",
      row.invoiceNumber,
      row.supplier.businessName,
      row.supplier.tin ?? "",
      formatKobo(kobo(row.subtotalKobo)),
      formatKobo(kobo(row.vatKobo)),
      formatKobo(kobo(row.totalKobo)),
      row.stampedAt ? formatDateTime(row.stampedAt) : "",
    ]),
  );
}

export async function findInvitationCode(linkId: string): Promise<string | null> {
  const db = await getDb();
  const invitation = await db.query.invitations.findFirst({
    where: eq(invitations.supplierLinkId, linkId),
    orderBy: desc(invitations.createdAt),
  });
  return invitation?.code ?? null;
}

/**
 * Link status to the chip a buyer sees. Shared by the list and the detail
 * screen, which had drifted: one showed an un-invited vendor as "Draft" and
 * the other showed the same row as "Invited".
 *
 * "imported" earns its own chip. A vendor sitting in the file who has never
 * been contacted is the buyer's largest and most actionable group, and neither
 * "Draft" nor "Invited" is true of them.
 */
export function linkChipStatus(status: string): "live" | "opened" | "invited" | "stuck" | "notInvited" {
  if (status === "live" || status === "opened" || status === "invited") return status;
  if (status === "deleted") return "stuck";
  return "notInvited";
}
