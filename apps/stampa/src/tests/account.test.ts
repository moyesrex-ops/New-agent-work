/**
 * Export and deletion (tickets T-05, T-06; test plan AT-18, AT-19).
 *
 * This path shipped without a single test, which is the wrong way round: it is
 * the only place in the product that destroys data, and the promises it makes
 * on screen — you can leave with your records, your details are gone in thirty
 * days — are the ones a supplier has least ability to verify.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { auditEvents, invoices, sessions, supplierLinks, suppliers } from "@/lib/db/schema";
import { kobo } from "@/lib/money";
import { newId } from "@/lib/ids";
import {
  DELETED_BUSINESS_NAME,
  HARD_DELETE_AFTER_DAYS,
  canDelete,
  exportInvoicesCsv,
  purgeDeletedAccounts,
  softDeleteAccount,
} from "@/lib/services/account";
import { FAKE_TRIGGERS } from "@/lib/gateway";
import { createInvoice, transmitInvoice } from "@/lib/services/invoices";
import { makeFixture, type Fixture } from "./support/db";
import { installFakeMessengers } from "./support/messaging";

let fixture: Fixture;
let actor: { type: "supplier"; id: string };

beforeEach(async () => {
  fixture = await makeFixture();
  actor = { type: "supplier", id: fixture.supplierId };
  installFakeMessengers();
});

async function stamped(description: string, unitPrice: number) {
  const invoice = await createInvoice(
    {
      supplierId: fixture.supplierId,
      organisationId: fixture.organisationId,
      description,
      quantity: 2,
      unitPriceKobo: kobo(unitPrice),
    },
    actor,
  );
  await transmitInvoice(invoice.id, `t-${invoice.id}`, actor);
  return invoice;
}

function days(n: number): number {
  return n * 24 * 60 * 60 * 1000;
}

describe("Given a supplier who wants to leave with their records", () => {
  it("Then the export has a row per invoice, not a row per line", async () => {
    await stamped("Roofing sheets, 0.55mm", 1_850_000);
    await stamped("Aluminium railings", 920_000);

    const csv = await exportInvoicesCsv(fixture.supplierId);
    const rows = csv.trim().split("\n");

    expect(rows).toHaveLength(3);
  });

  it("Then it carries the reference, which is the only part a customer will check", async () => {
    await stamped("Roofing sheets, 0.55mm", 1_850_000);

    const csv = await exportInvoicesCsv(fixture.supplierId);
    const [header, row] = csv.trim().split("\n");

    expect(header).toContain("NRS reference");
    // An IRN, not an empty column where one should be.
    expect(row).toMatch(/IRN-[A-Z0-9]{4}-[A-Z0-9]{4}-\d{4}/);
  });

  it("Then money is naira and kobo, not the integers we store", async () => {
    await stamped("Roofing sheets, 0.55mm", 1_850_000);

    const csv = await exportInvoicesCsv(fixture.supplierId);

    expect(csv).toContain("37,000.00");
    expect(csv).not.toContain("3700000");
  });

  it("Then a supplier who has done nothing yet gets headers, not an error", async () => {
    const csv = await exportInvoicesCsv(fixture.supplierId);

    expect(csv.trim().split("\n")).toHaveLength(1);
    expect(csv).toContain("Invoice number");
  });

  it("Then it never reaches another supplier's invoices", async () => {
    await stamped("Roofing sheets, 0.55mm", 1_850_000);

    const strangerId = newId("sup");
    await fixture.db.insert(suppliers).values({
      id: strangerId,
      businessName: "Somebody Else Ltd",
      phone: "+2348039999999",
    });

    expect((await exportInvoicesCsv(strangerId)).trim().split("\n")).toHaveLength(1);
  });
});

describe("Given an invoice is still in flight", () => {
  it("Then deletion is refused, because a tax record cannot be left ownerless", async () => {
    const invoice = await createInvoice(
      {
        supplierId: fixture.supplierId,
        organisationId: fixture.organisationId,
        description: `Pallet delivery ${FAKE_TRIGGERS.nrsDown}`,
        quantity: 1,
        unitPriceKobo: kobo(100_000),
      },
      actor,
    );
    await transmitInvoice(invoice.id, `t-${invoice.id}`, actor);

    const [row] = await fixture.db
      .select({ status: invoices.status })
      .from(invoices)
      .where(eq(invoices.id, invoice.id));
    expect(row.status).toBe("queued");

    expect(await canDelete(fixture.supplierId)).toEqual({
      allowed: false,
      reason: "pending_transmission",
    });
    await expect(softDeleteAccount(fixture.supplierId)).rejects.toThrow(/pending/i);
  });
});

describe("Given a supplier deletes their account", () => {
  beforeEach(async () => {
    await stamped("Roofing sheets, 0.55mm", 1_850_000);
    await createInvoice(
      {
        supplierId: fixture.supplierId,
        organisationId: fixture.organisationId,
        description: "A draft they never sent",
        quantity: 1,
        unitPriceKobo: kobo(50_000),
      },
      actor,
    );
    await softDeleteAccount(fixture.supplierId);
  });

  it("Then the stamped invoice survives, because it is a tax record", async () => {
    const rows = await fixture.db
      .select({ status: invoices.status })
      .from(invoices)
      .where(eq(invoices.supplierId, fixture.supplierId));

    expect(rows.filter((row) => row.status === "stamped")).toHaveLength(1);
  });

  it("Then the unsent draft is gone, because it is not a record of anything", async () => {
    const rows = await fixture.db
      .select({ status: invoices.status })
      .from(invoices)
      .where(eq(invoices.supplierId, fixture.supplierId));

    expect(rows.some((row) => row.status === "draft")).toBe(false);
  });

  it("Then every session ends, so the phone in their hand is signed out", async () => {
    const rows = await fixture.db
      .select({ revokedAt: sessions.revokedAt })
      .from(sessions)
      .where(eq(sessions.subjectId, fixture.supplierId));

    expect(rows.every((row) => row.revokedAt !== null)).toBe(true);
  });

  it("Then the buyer sees them as gone rather than as a vendor still to chase", async () => {
    const [link] = await fixture.db
      .select({ status: supplierLinks.status })
      .from(supplierLinks)
      .where(eq(supplierLinks.supplierId, fixture.supplierId));

    expect(link.status).toBe("deleted");
  });

  it("Then the deletion is audited", async () => {
    const rows = await fixture.db
      .select({ action: auditEvents.action })
      .from(auditEvents)
      .where(eq(auditEvents.subjectId, fixture.supplierId));

    expect(rows.map((row) => row.action)).toContain("account.deleted");
  });
});

describe("Given the thirty-day window", () => {
  beforeEach(async () => {
    await stamped("Roofing sheets, 0.55mm", 1_850_000);
    await softDeleteAccount(fixture.supplierId);
  });

  it("Then nothing is purged while the supplier could still ask for it back", async () => {
    const purged = await purgeDeletedAccounts(new Date(Date.now() + days(29)));

    expect(purged).toBe(0);
    const [row] = await fixture.db
      .select({ businessName: suppliers.businessName })
      .from(suppliers)
      .where(eq(suppliers.id, fixture.supplierId));
    expect(row.businessName).toBe("Emeka Aluminium Works Ltd");
  });

  it("Then once it closes the row no longer names anybody", async () => {
    const purged = await purgeDeletedAccounts(
      new Date(Date.now() + days(HARD_DELETE_AFTER_DAYS + 1)),
    );

    expect(purged).toBe(1);
    const [row] = await fixture.db
      .select({
        businessName: suppliers.businessName,
        phone: suppliers.phone,
        tin: suppliers.tin,
        address: suppliers.address,
      })
      .from(suppliers)
      .where(eq(suppliers.id, fixture.supplierId));

    expect(row.businessName).toBe(DELETED_BUSINESS_NAME);
    expect(row.tin).toBeNull();
    expect(row.address).toBe("");
    // NOT NULL and uniquely indexed, so it takes a tombstone rather than a null.
    expect(row.phone).not.toContain("803");
  });

  it("Then the stamped invoice is still there, now attached to nobody", async () => {
    await purgeDeletedAccounts(new Date(Date.now() + days(HARD_DELETE_AFTER_DAYS + 1)));

    const rows = await fixture.db
      .select({ status: invoices.status })
      .from(invoices)
      .where(eq(invoices.supplierId, fixture.supplierId));

    expect(rows.filter((row) => row.status === "stamped")).toHaveLength(1);
  });

  it("Then running it twice does not purge the same account twice", async () => {
    const later = new Date(Date.now() + days(HARD_DELETE_AFTER_DAYS + 1));
    await purgeDeletedAccounts(later);

    expect(await purgeDeletedAccounts(later)).toBe(0);
  });

  it("Then a live supplier is never touched by it", async () => {
    const liveId = newId("sup");
    await fixture.db.insert(suppliers).values({
      id: liveId,
      businessName: "Still Trading Ltd",
      phone: "+2348038888888",
    });

    await purgeDeletedAccounts(new Date(Date.now() + days(365)));

    const [row] = await fixture.db
      .select({ businessName: suppliers.businessName })
      .from(suppliers)
      .where(eq(suppliers.id, liveId));
    expect(row.businessName).toBe("Still Trading Ltd");
  });

  it("Then the purge is audited, so the promise can be shown to have been kept", async () => {
    await purgeDeletedAccounts(new Date(Date.now() + days(HARD_DELETE_AFTER_DAYS + 1)));

    const rows = await fixture.db
      .select({ action: auditEvents.action })
      .from(auditEvents)
      .where(eq(auditEvents.subjectId, fixture.supplierId));

    expect(rows.map((row) => row.action)).toContain("account.purged");
  });
});
