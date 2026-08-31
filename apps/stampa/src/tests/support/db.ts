import { createTestDb, setTestDb, type Db } from "@/lib/db/client";
import { buyerUsers, organisations, supplierLinks, suppliers } from "@/lib/db/schema";
import { newId } from "@/lib/ids";
import { createInvitationFor } from "@/lib/services/onboarding";

export type Fixture = {
  db: Db;
  organisationId: string;
  supplierId: string;
  linkId: string;
  code: string;
};

/**
 * A fresh in-memory Postgres with one buyer and one invited supplier. Every
 * database test starts from the same known shape so a failure points at the
 * change rather than at the fixture.
 */
export async function makeFixture(): Promise<Fixture> {
  const db = await createTestDb();
  setTestDb(db);

  const organisationId = newId("org");
  await db.insert(organisations).values({
    id: organisationId,
    legalName: "Agbara Foods Plc",
    tin: "20334455-0001",
    address: "Km 38 Lagos-Badagry Expressway, Agbara",
    inviteSlug: "AGB",
  });

  await db.insert(buyerUsers).values({
    id: newId("usr"),
    organisationId,
    email: "tax.manager@agbarafoods.com",
    role: "buyer_admin",
  });

  const supplierId = newId("sup");
  await db.insert(suppliers).values({
    id: supplierId,
    businessName: "Emeka Aluminium Works Ltd",
    tin: "20481166-0001",
    address: "14 Ladipo Street, Oshodi, Lagos",
    phone: "+2348030000001",
  });

  const linkId = newId("lnk");
  await db.insert(supplierLinks).values({
    id: linkId,
    supplierId,
    organisationId,
    vendorCode: "V-1001",
    bankName: "Zenith Bank",
    bankLast4: "4471",
    annualSpendKobo: 42_000_000_00,
    status: "imported",
  });

  const code = "AGB-4471";
  await createInvitationFor(linkId, code, "whatsapp");

  return { db, organisationId, supplierId, linkId, code };
}
