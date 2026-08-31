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
import { addKobo, applyBasisPoints, kobo, ZERO, type Kobo } from "../money";
import { STANDARD_VAT_BASIS_POINTS } from "../vat";
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

  return {
    totalVendors: links.length,
    exposedVendors,
    compliantVendors,
    uncheckableVendors,
    vatAtRiskKobo,
    spendSource,
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
    try {
      await createInvitationFor(link.id, code, "whatsapp");
      await writeAudit(db, {
        actor,
        action: "invitation.sent",
        subjectType: "supplier_link",
        subjectId: link.id,
        after: { channel: "whatsapp" },
      });
      outcomes.push({ linkId: link.id, sent: true, code });
    } catch {
      outcomes.push({
        linkId: link.id,
        sent: false,
        problem: "we could not reach this number",
      });
    }
  }

  await track(db, "buyer_invites_sent", actor, {
    count: outcomes.filter((outcome) => outcome.sent).length,
  });

  return outcomes;
}

export async function getOrganisation(organisationId: string) {
  const db = await getDb();
  return db.query.organisations.findFirst({ where: eq(organisations.id, organisationId) });
}

export async function findInvitationCode(linkId: string): Promise<string | null> {
  const db = await getDb();
  const invitation = await db.query.invitations.findFirst({
    where: eq(invitations.supplierLinkId, linkId),
    orderBy: desc(invitations.createdAt),
  });
  return invitation?.code ?? null;
}
