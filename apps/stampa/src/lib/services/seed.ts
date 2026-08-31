/**
 * Local seed data (ticket F-05).
 *
 * This refuses to run against production. The handover pack forbids
 * fake-active production data, and a seed script that can be pointed at a live
 * database is how that rule gets broken by accident at 2am.
 *
 * The data is deliberately unflattering: some suppliers never opened their
 * invite, one is stuck, one will fail transmission. A demo where everything
 * works teaches nobody how the product behaves.
 */
import { eq, sql } from "drizzle-orm";
import { getDb } from "../db/client";
import {
  buyerUsers,
  invitations,
  invoices,
  organisations,
  supplierLinks,
  suppliers,
} from "../db/schema";
import { newId } from "../ids";
import { kobo } from "../money";
import { FAKE_TRIGGERS } from "../gateway";
import { MAX_ATTEMPTS, createInvoice, transmitInvoice } from "./invoices";

export const DEMO_BUYER = {
  name: "Agbara Foods Plc",
  slug: "AGB",
  tin: "20334455-0001",
  email: "tax.manager@agbarafoods.com",
} as const;

/**
 * A second customer, and the only reason it exists is that its TIN is the one
 * the fake gateway rejects.
 *
 * Without it the buyer-fault branch of S10 — the screen that tells a supplier
 * the problem is not theirs and that we have already told their customer — has
 * no way to be rendered by anyone, in a browser or otherwise. It has no buyer
 * user, so it never appears in the console; a supplier invoicing two customers
 * is the ordinary case anyway.
 */
const SECOND_BUYER = {
  name: "Lekki Beverages Ltd",
  slug: "LKB",
  tin: `${FAKE_TRIGGERS.buyerTinRejected}-0001`,
} as const;

/** Every seeded invite lands on a predictable code so QA can bookmark it. */
export const DEMO_INVITE_CODE = "AGB-4471";
export const DEMO_SUPPLIER_PHONE = "+2348030000001";

type SeedSupplier = {
  name: string;
  phone: string;
  tin: string | null;
  address: string;
  bank: string | null;
  last4: string | null;
  spendKobo: number | null;
  status: "imported" | "invited" | "opened" | "live";
  code?: string;
};

const SUPPLIERS: SeedSupplier[] = [
  {
    name: "Emeka Aluminium Works Ltd",
    phone: DEMO_SUPPLIER_PHONE,
    tin: "20481166-0001",
    address: "14 Ladipo Street, Oshodi, Lagos",
    bank: "Zenith Bank",
    last4: "4471",
    spendKobo: 42_000_000_00,
    status: "invited",
    code: DEMO_INVITE_CODE,
  },
  {
    name: "Ify Packaging Enterprises",
    phone: "+2348030000002",
    tin: "20481167-0001",
    address: "9 Trade Fair Road, Ojo, Lagos",
    bank: "GTBank",
    last4: "1122",
    spendKobo: 18_500_000_00,
    status: "live",
  },
  {
    name: "Sunrise Logistics Nigeria",
    phone: "+2348030000003",
    tin: null,
    address: "3 Apapa Wharf Road, Lagos",
    bank: "Access Bank",
    last4: "8899",
    spendKobo: 7_250_000_00,
    status: "imported",
  },
  {
    name: "Bola Industrial Chemicals",
    phone: "+2348030000004",
    tin: "20481169-0001",
    address: "22 Amuwo Odofin, Lagos",
    bank: "UBA",
    last4: "3301",
    spendKobo: 31_000_000_00,
    status: "opened",
  },
  {
    name: "Chinedu Steel & Fittings",
    phone: "+2348030000005",
    tin: "20481170-0001",
    address: "5 Iganmu Industrial Estate, Lagos",
    bank: "First Bank",
    last4: "7788",
    spendKobo: 12_400_000_00,
    status: "live",
  },
  {
    name: "Halima Transport Services",
    phone: "+2348030000006",
    tin: "20481171-0001",
    address: "17 Mile 2, Lagos",
    bank: "Fidelity Bank",
    last4: "2255",
    spendKobo: 9_800_000_00,
    status: "imported",
  },
];

export async function seed(): Promise<{ inviteCode: string; organisationId: string }> {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to seed a production database");
  }

  const db = await getDb();
  const existing = await db.query.organisations.findFirst();
  if (existing) {
    return { inviteCode: DEMO_INVITE_CODE, organisationId: existing.id };
  }

  const organisationId = newId("org");
  await db.insert(organisations).values({
    id: organisationId,
    legalName: DEMO_BUYER.name,
    rcNumber: "RC 412889",
    tin: DEMO_BUYER.tin,
    address: "Km 38 Lagos-Badagry Expressway, Agbara, Ogun State",
    inviteSlug: DEMO_BUYER.slug,
    plan: "pilot",
  });

  await db.insert(buyerUsers).values({
    id: newId("usr"),
    organisationId,
    email: DEMO_BUYER.email,
    name: "Tax Manager",
    role: "buyer_admin",
  });

  const now = new Date();
  const liveSupplierIds: string[] = [];

  for (const entry of SUPPLIERS) {
    const supplierId = newId("sup");
    await db.insert(suppliers).values({
      id: supplierId,
      businessName: entry.name,
      tin: entry.tin,
      address: entry.address,
      phone: entry.phone,
      confirmedAt: entry.status === "live" ? now : null,
    });

    const linkId = newId("lnk");
    await db.insert(supplierLinks).values({
      id: linkId,
      supplierId,
      organisationId,
      vendorCode: `V-${1000 + SUPPLIERS.indexOf(entry)}`,
      category: "Supplies",
      bankName: entry.bank,
      bankLast4: entry.last4,
      annualSpendKobo: entry.spendKobo,
      status: entry.status,
      invitedAt: entry.status === "imported" ? null : daysAgo(now, 9),
      openedAt: entry.status === "opened" || entry.status === "live" ? daysAgo(now, 8) : null,
      activatedAt: entry.status === "live" ? daysAgo(now, 8) : null,
    });

    if (entry.status !== "imported") {
      await db.insert(invitations).values({
        id: newId("invt"),
        code: entry.code ?? `${DEMO_BUYER.slug}-${supplierId.slice(-4).toUpperCase()}`,
        supplierLinkId: linkId,
        channel: "whatsapp",
        sentAt: daysAgo(now, 9),
        // Backdated past the three-day mark on purpose, so the day-3 nudge has
        // a genuine candidate the first time the worker runs.
        openedAt: entry.status === "opened" || entry.status === "live" ? daysAgo(now, 8) : null,
        expiresAt: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000),
      });
    }

    if (entry.status === "live") liveSupplierIds.push(supplierId);
  }

  const [packaging, steel] = liveSupplierIds;

  const secondBuyerId = newId("org");
  await db.insert(organisations).values({
    id: secondBuyerId,
    legalName: SECOND_BUYER.name,
    rcNumber: "RC 771204",
    tin: SECOND_BUYER.tin,
    address: "7 Admiralty Way, Lekki Phase 1, Lagos",
    inviteSlug: SECOND_BUYER.slug,
    plan: "pilot",
  });

  if (packaging) {
    await db.insert(supplierLinks).values({
      id: newId("lnk"),
      supplierId: packaging,
      organisationId: secondBuyerId,
      vendorCode: "V-2001",
      category: "Supplies",
      bankName: "GTBank",
      bankLast4: "1122",
      annualSpendKobo: 6_400_000_00,
      status: "live",
      invitedAt: daysAgo(now, 30),
      openedAt: daysAgo(now, 30),
      activatedAt: daysAgo(now, 30),
    });
  }

  // A history worth looking at. Enough rows that the S5 search box earns its
  // place, spread over months so the list is not one undifferentiated block of
  // today, and three different failures so the operator queue has real groups.
  if (packaging) {
    await history(organisationId, packaging, now, [
      ["Corrugated cartons, 300gsm", 4000, 1_250_00, 132],
      ["Shrink wrap, 500m rolls", 120, 18_400_00, 118],
      ["Pallet wrap, 23 micron", 260, 9_800_00, 96],
      ["Corrugated cartons, 300gsm", 2500, 1_250_00, 74],
      ["Carton handles, nylon", 12000, 41_00, 61],
      ["Adhesive tape, 48mm", 900, 1_150_00, 47],
      ["Shrink wrap, 500m rolls", 200, 18_400_00, 33],
      ["Stretch film, machine grade", 80, 26_500_00, 21],
      ["Corrugated cartons, 300gsm", 5200, 1_250_00, 12],
      ["Carton liners, kraft", 3000, 320_00, 4],
    ]);

    // One of each fault, all on the same supplier, so all three S10 variants
    // can be reached from a single sign-in — by the browser walk and by anyone
    // reviewing the copy.
    //
    // The NRS outage is seeded twice on purpose. Retried to exhaustion it is
    // the only way to reach the "nobody's fault" rejection; left on its first
    // attempt it is what the operator queue looks like while a retry is still
    // pending. Both states exist in production and both need looking at.
    await failed(organisationId, packaging, now, `Pallet delivery ${FAKE_TRIGGERS.nrsDown}`, 10, 45_000_00, 2, "exhaust");
    await failed(organisationId, packaging, now, `Crate liners ${FAKE_TRIGGERS.nrsDown}`, 60, 1_900_00, 1);
    await failed(organisationId, packaging, now, `Bale twine ${FAKE_TRIGGERS.supplierFault}`, 40, 3_400_00, 1);
    await failed(secondBuyerId, packaging, now, "Bottle crates, stackable", 300, 2_150_00, 1);
  }

  if (steel) {
    await history(organisationId, steel, now, [
      ["Mild steel angle bar, 50mm", 300, 12_600_00, 58],
      ["Galvanised sheet, 1.2mm", 180, 31_400_00, 40],
      ["Steel fittings, assorted", 640, 4_250_00, 17],
    ]);

    // A code we have never seen. This is the group an operator has to triage
    // by hand, and the demo is dishonest without one.
    await failed(organisationId, steel, now, `Rebar 16mm ${FAKE_TRIGGERS.unmappedCode}`, 220, 8_900_00, 3);
  }

  return { inviteCode: DEMO_INVITE_CODE, organisationId };
}

function daysAgo(now: Date, days: number): Date {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

/**
 * Invoices are created through the real service, then their timestamps are
 * pushed backwards. Writing rows directly would skip the totals, the audit
 * entry and the transmission record — which is precisely the machinery a demo
 * is meant to exercise.
 */
async function backdate(invoiceId: string, when: Date): Promise<void> {
  const db = await getDb();
  await db
    .update(invoices)
    .set({ createdAt: when, issuedAt: when })
    .where(eq(invoices.id, invoiceId));
}

async function history(
  organisationId: string,
  supplierId: string,
  now: Date,
  lines: ReadonlyArray<readonly [string, number, number, number]>,
): Promise<void> {
  const actor = { type: "supplier" as const, id: supplierId };

  for (const [description, quantity, unitPrice, age] of lines) {
    const invoice = await createInvoice(
      { supplierId, organisationId, description, quantity, unitPriceKobo: kobo(unitPrice) },
      actor,
    );
    await transmitInvoice(invoice.id, `seed-${invoice.id}`, actor);
    await backdate(invoice.id, daysAgo(now, age));
  }
}

async function failed(
  organisationId: string,
  supplierId: string,
  now: Date,
  description: string,
  quantity: number,
  unitPrice: number,
  age: number,
  retries: "once" | "exhaust" = "once",
): Promise<void> {
  const actor = { type: "supplier" as const, id: supplierId };
  const invoice = await createInvoice(
    { supplierId, organisationId, description, quantity, unitPriceKobo: kobo(unitPrice) },
    actor,
  );

  // The same idempotency key each time, which is what makes this a retry of
  // one transmission rather than several transmissions of one invoice.
  const key = `seed-${invoice.id}`;
  const attempts = retries === "exhaust" ? MAX_ATTEMPTS : 1;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const result = await transmitInvoice(invoice.id, key, actor);
    if (result.state !== "rejected" || !result.willRetry) break;
  }

  await backdate(invoice.id, daysAgo(now, age));
}

export async function isSeeded(): Promise<boolean> {
  const db = await getDb();
  const [row] = await db.select({ count: sql<number>`count(*)::int` }).from(organisations);
  return (row?.count ?? 0) > 0;
}
