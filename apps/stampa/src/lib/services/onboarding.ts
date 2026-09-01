/**
 * Invite → verify → confirm (tickets S-01..S-03).
 *
 * The design point that carries the whole funnel: by the time the supplier
 * reaches Confirm business, we already know their name, TIN and address,
 * because the buyer told us. A scam asks; a legitimate system already has it
 * (Trust script, mechanism 4).
 */
import { and, eq } from "drizzle-orm";
import { getDb, type Db } from "../db/client";
import { invitations, suppliers, supplierLinks } from "../db/schema";
import { newId } from "../ids";
import { writeAudit, type Actor } from "../audit";
import { track } from "../analytics";
import { parsePhone, type E164 } from "../phone";
import { parseTin } from "../tin";
import { assertNoBankWrite } from "../auth/policy";

export type InviteView =
  | { state: "invalid" }
  | { state: "expired"; buyerName: string }
  | {
      state: "open";
      code: string;
      buyerName: string;
      supplierId: string;
      supplierName: string;
      supplierPhone: string;
      tin: string | null;
      address: string;
      bankName: string | null;
      bankLast4: string | null;
      alreadyActive: boolean;
    };

export async function openInvite(code: string, now = new Date()): Promise<InviteView> {
  const db = await getDb();

  const invitation = await db.query.invitations.findFirst({
    where: eq(invitations.code, code),
  });
  if (!invitation) return { state: "invalid" };

  const link = await db.query.supplierLinks.findFirst({
    where: eq(supplierLinks.id, invitation.supplierLinkId),
    with: { supplier: true, organisation: true },
  });
  if (!link) return { state: "invalid" };

  if (invitation.expiresAt.getTime() <= now.getTime()) {
    return { state: "expired", buyerName: link.organisation.legalName };
  }

  if (!invitation.openedAt) {
    await db
      .update(invitations)
      .set({ openedAt: now })
      .where(eq(invitations.id, invitation.id));
    await db
      .update(supplierLinks)
      .set({ openedAt: now, status: link.status === "invited" ? "opened" : link.status })
      .where(eq(supplierLinks.id, link.id));
    await writeAudit(db, {
      actor: { type: "anonymous" },
      action: "invitation.opened",
      subjectType: "invitation",
      subjectId: invitation.id,
    });
    await track(db, "invite_opened", { type: "anonymous" }, { channel: invitation.channel });
  }

  return {
    state: "open",
    code,
    buyerName: link.organisation.legalName,
    supplierId: link.supplier.id,
    supplierName: link.supplier.businessName,
    supplierPhone: link.supplier.phone,
    tin: link.supplier.tin,
    address: link.supplier.address,
    bankName: link.bankName,
    bankLast4: link.bankLast4,
    alreadyActive: Boolean(link.activatedAt),
  };
}

/**
 * Bind a verified phone to the invited supplier record.
 *
 * A number that differs from the vendor master is accepted rather than
 * blocked. Blocking would tell a supplier their own phone number is wrong,
 * and the mismatch is the buyer's data problem to reconcile — flagged to them,
 * not thrown at the person trying to get paid (Flow 1 failure table).
 */
/** A second, different number tried to claim an invitation that is already taken. */
export class InviteAlreadyBoundError extends Error {
  constructor() {
    super("This invitation is already bound to another number");
    this.name = "InviteAlreadyBoundError";
  }
}

export async function bindSupplierToInvite(
  code: string,
  verifiedPhone: E164,
  now = new Date(),
): Promise<{ supplierId: string; phoneMismatch: boolean }> {
  const db = await getDb();

  const invitation = await db.query.invitations.findFirst({ where: eq(invitations.code, code) });
  if (!invitation) throw new Error("Invitation not found");

  const link = await db.query.supplierLinks.findFirst({
    where: eq(supplierLinks.id, invitation.supplierLinkId),
    with: { supplier: true },
  });
  if (!link) throw new Error("Supplier link not found");

  const expected = parsePhone(link.supplier.phone);
  const phoneMismatch = expected.ok && expected.value !== verifiedPhone;

  // An invite that has already been claimed cannot be claimed again by a
  // different number. These links travel by WhatsApp forward, which is the
  // whole distribution mechanic, so without this the second person to open a
  // forwarded link takes over the first person's account: `mergeSupplierPhone`
  // would happily repoint the supplier record at whoever verified last.
  if (invitation.boundAt && phoneMismatch) {
    throw new InviteAlreadyBoundError();
  }

  const supplierId = await mergeSupplierPhone(db, link.supplierId, verifiedPhone);

  await db
    .update(invitations)
    .set({ boundAt: invitation.boundAt ?? now })
    .where(eq(invitations.id, invitation.id));

  await writeAudit(db, {
    actor: { type: "supplier", id: supplierId },
    action: "invitation.bound",
    subjectType: "invitation",
    subjectId: invitation.id,
    after: { phoneMismatch },
  });
  await track(db, "supplier_verified", { type: "supplier", id: supplierId }, { phoneMismatch });

  return { supplierId, phoneMismatch };
}

/**
 * A supplier exists once across the platform. If the verified number already
 * belongs to a supplier record, the invited placeholder is folded into it —
 * that is the mechanism behind `supplier_added_second_buyer` and the network
 * effect it measures.
 */
async function mergeSupplierPhone(db: Db, invitedId: string, phone: E164): Promise<string> {
  const existing = await db.query.suppliers.findFirst({ where: eq(suppliers.phone, phone) });

  if (!existing) {
    await db.update(suppliers).set({ phone }).where(eq(suppliers.id, invitedId));
    return invitedId;
  }
  if (existing.id === invitedId) return invitedId;

  // Repoint the link at the real supplier and drop the placeholder.
  const [link] = await db
    .update(supplierLinks)
    .set({ supplierId: existing.id })
    .where(eq(supplierLinks.supplierId, invitedId))
    .returning();

  if (link) {
    await track(db, "supplier_added_second_buyer", { type: "supplier", id: existing.id });
  }
  await db.delete(suppliers).where(eq(suppliers.id, invitedId));
  return existing.id;
}

export type ConfirmInput = {
  businessName: string;
  tin: string;
  address: string;
};

export async function confirmSupplierDetails(
  supplierId: string,
  organisationId: string,
  input: ConfirmInput,
  actor: Actor,
  now = new Date(),
): Promise<void> {
  // Belt and braces: this path physically cannot carry a bank field, and if a
  // future caller tries, it throws rather than writes.
  assertNoBankWrite(input as unknown as Record<string, unknown>);

  const parsedTin = parseTin(input.tin);
  if (!parsedTin.ok) throw new Error(`invalid TIN (${parsedTin.error})`);

  const db = await getDb();
  const before = await db.query.suppliers.findFirst({ where: eq(suppliers.id, supplierId) });

  await db
    .update(suppliers)
    .set({
      businessName: input.businessName.trim(),
      tin: parsedTin.value,
      address: input.address.trim(),
      confirmedAt: now,
    })
    .where(eq(suppliers.id, supplierId));

  await db
    .update(supplierLinks)
    .set({ status: "live", activatedAt: now })
    .where(
      and(
        eq(supplierLinks.supplierId, supplierId),
        eq(supplierLinks.organisationId, organisationId),
      ),
    );

  await writeAudit(db, {
    actor,
    action: "supplier.confirmed",
    subjectType: "supplier",
    subjectId: supplierId,
    before: before ? { businessName: before.businessName, tin: before.tin } : null,
    after: { businessName: input.businessName, tin: parsedTin.value },
  });
  await track(db, "supplier_confirmed_details", actor);
}

export async function getSupplierWithLinks(supplierId: string) {
  const db = await getDb();
  return db.query.suppliers.findFirst({
    where: eq(suppliers.id, supplierId),
    with: { links: { with: { organisation: true } } },
  });
}

export async function findSupplierByPhone(phone: E164) {
  const db = await getDb();
  return db.query.suppliers.findFirst({ where: eq(suppliers.phone, phone) });
}

export async function createInvitationFor(
  supplierLinkId: string,
  code: string,
  channel: string,
  ttlDays = 30,
  now = new Date(),
): Promise<string> {
  const db = await getDb();
  const id = newId("invt");
  await db.insert(invitations).values({
    id,
    code,
    supplierLinkId,
    channel,
    sentAt: now,
    expiresAt: new Date(now.getTime() + ttlDays * 24 * 60 * 60 * 1000),
  });
  await db
    .update(supplierLinks)
    .set({ invitedAt: now, status: "invited" })
    .where(eq(supplierLinks.id, supplierLinkId));
  return id;
}
