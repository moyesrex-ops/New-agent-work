/**
 * Buyer console: the exposure figure that is the wedge, and the vendor-master
 * import that is the only path allowed to touch bank fields.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { auditEvents, invitations, supplierLinks } from "@/lib/db/schema";
import { formatKobo, kobo } from "@/lib/money";
import { computeExposure, importVendors, listSuppliers, sendInvitations } from "@/lib/services/buyer";
import { ingestVendorMaster } from "@/lib/services/vendor-master";
import { createInvoice, transmitInvoice } from "@/lib/services/invoices";
import { makeFixture, type Fixture } from "./support/db";

let fixture: Fixture;
const buyerActor = { type: "buyer" as const, id: "usr_1" };

beforeEach(async () => {
  fixture = await makeFixture();
});

describe("exposure", () => {
  it("counts a vendor with no TIN as uncheckable, not as exposed", async () => {
    const csv = [
      "Vendor Name,Phone,TIN,Annual Spend",
      "Has TIN Ltd,08030000010,20481180-0001,10000000",
      "No TIN Ltd,08030000011,,10000000",
    ].join("\n");
    await importVendors(fixture.organisationId, ingestVendorMaster(csv).vendors, buyerActor);

    const exposure = await computeExposure(fixture.organisationId, buyerActor);
    expect(exposure.totalVendors).toBe(3); // two imported plus the fixture supplier
    expect(exposure.uncheckableVendors).toBe(1);
    expect(exposure.exposedVendors).toBe(2);
  });

  it("stops counting a vendor as exposed once they have stamped an invoice", async () => {
    const before = await computeExposure(fixture.organisationId, buyerActor);
    expect(before.exposedVendors).toBe(1);

    const invoice = await createInvoice(
      {
        supplierId: fixture.supplierId,
        organisationId: fixture.organisationId,
        description: "Aluminium railings",
        quantity: 50,
        unitPriceKobo: kobo(3_442_000),
      },
      { type: "supplier", id: fixture.supplierId },
    );
    await transmitInvoice(invoice.id, "key-exposure", { type: "supplier", id: fixture.supplierId });

    const after = await computeExposure(fixture.organisationId, buyerActor);
    expect(after.exposedVendors).toBe(0);
    expect(after.compliantVendors).toBe(1);
    expect(after.vatAtRiskKobo).toBe(0);
  });

  it("sources the figure from the buyer's own spend column when they gave one", async () => {
    // Fixture supplier carries NGN 42,000,000 annual spend. A quarter of that
    // at 7.5% is NGN 787,500.00 — a number a Financial Controller can check.
    const exposure = await computeExposure(fixture.organisationId, buyerActor);
    expect(exposure.spendSource).toBe("buyer_data");
    expect(formatKobo(exposure.vatAtRiskKobo)).toBe("787,500.00");
  });

  it("says so when the figure rests on our assumption instead", async () => {
    const csv = "Vendor Name,Phone,TIN\nNo Spend Ltd,08030000012,20481181-0001\n";
    await importVendors(fixture.organisationId, ingestVendorMaster(csv).vendors, buyerActor);

    await fixture.db.delete(invitations).where(eq(invitations.supplierLinkId, fixture.linkId));
    await fixture.db.delete(supplierLinks).where(eq(supplierLinks.id, fixture.linkId));
    const exposure = await computeExposure(fixture.organisationId, buyerActor);
    expect(exposure.spendSource).toBe("assumption");
  });

  it("handles an organisation with no vendors at all", async () => {
    await fixture.db.delete(invitations);
    await fixture.db.delete(supplierLinks);
    const exposure = await computeExposure(fixture.organisationId, buyerActor);
    expect(exposure).toMatchObject({
      totalVendors: 0,
      exposedVendors: 0,
      uncheckableVendors: 0,
      vatAtRiskKobo: 0,
    });
  });
});

describe("vendor master import", () => {
  it("stores only the last four digits of an account number", async () => {
    const csv =
      "Vendor Name,Phone,Bank,Account Number\nNew Vendor Ltd,08030000020,Zenith Bank,0123456789\n";
    await importVendors(fixture.organisationId, ingestVendorMaster(csv).vendors, buyerActor);

    const link = await fixture.db.query.supplierLinks.findFirst({
      where: eq(supplierLinks.vendorCode, "V-1001"),
    });
    expect(link).toBeTruthy();

    const all = await fixture.db.select().from(supplierLinks);
    const added = all.find((row) => row.bankLast4 === "6789");
    expect(added).toBeTruthy();
    expect(JSON.stringify(all)).not.toContain("0123456789");
  });

  it("audits a change to bank details, because that is a payment-diversion vector", async () => {
    const csv =
      "Vendor Name,Phone,Bank,Account Number\nEmeka Aluminium Works Ltd,08030000001,Access Bank,9999999999\n";
    const summary = await importVendors(
      fixture.organisationId,
      ingestVendorMaster(csv).vendors,
      buyerActor,
    );

    expect(summary.bankChanges).toBe(1);
    const events = await fixture.db
      .select()
      .from(auditEvents)
      .where(eq(auditEvents.action, "supplier_link.bank_updated"));
    expect(events).toHaveLength(1);
    expect(events[0].before).toMatchObject({ bankLast4: "4471" });
    expect(events[0].after).toMatchObject({ bankLast4: "9999" });
  });

  it("does not overwrite details a supplier has already confirmed themselves", async () => {
    await fixture.db.execute(
      `update suppliers set confirmed_at = now(), business_name = 'Emeka Aluminium Works Limited'`,
    );
    const csv = "Vendor Name,Phone\nWRONG NAME FROM ERP,08030000001\n";
    await importVendors(fixture.organisationId, ingestVendorMaster(csv).vendors, buyerActor);

    const supplier = await fixture.db.query.suppliers.findFirst();
    expect(supplier?.businessName).toBe("Emeka Aluminium Works Limited");
  });

  it("re-importing the same file twice does not duplicate a supplier", async () => {
    const csv = "Vendor Name,Phone\nRepeat Ltd,08030000030\n";
    await importVendors(fixture.organisationId, ingestVendorMaster(csv).vendors, buyerActor);
    const second = await importVendors(
      fixture.organisationId,
      ingestVendorMaster(csv).vendors,
      buyerActor,
    );

    expect(second.created).toBe(0);
    const rows = await listSuppliers(fixture.organisationId);
    expect(rows.filter((row) => row.businessName === "Repeat Ltd")).toHaveLength(1);
  });
});

describe("invitations", () => {
  it("reports a result per recipient rather than a blanket outcome", async () => {
    const outcomes = await sendInvitations(fixture.organisationId, [fixture.linkId], buyerActor);
    expect(outcomes).toHaveLength(1);
    expect(outcomes[0].sent).toBe(true);
    expect(outcomes[0].code).toMatch(/^AGB-/);
  });

  it("ignores a link that belongs to another organisation", async () => {
    const outcomes = await sendInvitations(fixture.organisationId, ["lnk_not_ours"], buyerActor);
    expect(outcomes).toHaveLength(0);
  });

  it("surfaces the live status of each supplier for the console list", async () => {
    await sendInvitations(fixture.organisationId, [fixture.linkId], buyerActor);
    const rows = await listSuppliers(fixture.organisationId);
    expect(rows[0].status).toBe("invited");
    expect(rows[0].stampedCount).toBe(0);
    expect(rows[0].inviteCode).toMatch(/^AGB-/);
  });
});
