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
import { sql } from "drizzle-orm";
import { getDb } from "../db/client";
import {
  buyerUsers,
  invitations,
  organisations,
  supplierLinks,
  suppliers,
} from "../db/schema";
import { newId } from "../ids";
import { kobo } from "../money";
import { FAKE_TRIGGERS } from "../gateway";
import { createInvoice, transmitInvoice } from "./invoices";

export const DEMO_BUYER = {
  name: "Agbara Foods Plc",
  slug: "AGB",
  tin: "20334455-0001",
  email: "tax.manager@agbarafoods.com",
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
    status: "invited",
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
  let liveSupplierId: string | null = null;

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
      invitedAt: entry.status === "imported" ? null : now,
      openedAt: entry.status === "opened" || entry.status === "live" ? now : null,
      activatedAt: entry.status === "live" ? now : null,
    });

    if (entry.status !== "imported") {
      await db.insert(invitations).values({
        id: newId("invt"),
        code: entry.code ?? `${DEMO_BUYER.slug}-${supplierId.slice(-4).toUpperCase()}`,
        supplierLinkId: linkId,
        channel: "whatsapp",
        sentAt: now,
        openedAt: entry.status === "opened" || entry.status === "live" ? now : null,
        expiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      });
    }

    if (entry.status === "live") liveSupplierId = supplierId;
  }

  // A history worth looking at: two stamped, one that failed on purpose so the
  // operator failure queue and the S10 screen are not empty in a demo.
  if (liveSupplierId) {
    const actor = { type: "supplier" as const, id: liveSupplierId };

    for (const [description, quantity, unitPrice] of [
      ["Corrugated cartons, 300gsm", 4000, 1_250_00],
      ["Shrink wrap, 500m rolls", 120, 18_400_00],
    ] as const) {
      const invoice = await createInvoice(
        {
          supplierId: liveSupplierId,
          organisationId,
          description,
          quantity,
          unitPriceKobo: kobo(unitPrice),
        },
        actor,
      );
      await transmitInvoice(invoice.id, `seed-${invoice.id}`, actor);
    }

    const failing = await createInvoice(
      {
        supplierId: liveSupplierId,
        organisationId,
        description: `Pallet delivery ${FAKE_TRIGGERS.nrsDown}`,
        quantity: 10,
        unitPriceKobo: kobo(45_000_00),
      },
      actor,
    );
    await transmitInvoice(failing.id, `seed-${failing.id}`, actor);
  }

  return { inviteCode: DEMO_INVITE_CODE, organisationId };
}

export async function isSeeded(): Promise<boolean> {
  const db = await getDb();
  const [row] = await db.select({ count: sql<number>`count(*)::int` }).from(organisations);
  return (row?.count ?? 0) > 0;
}
