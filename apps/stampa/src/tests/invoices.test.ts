/**
 * Acceptance tests for the money path (Phase 18).
 *
 * These run against a real Postgres, because the properties being asserted —
 * unique idempotency keys, audit rows written in the same transaction as the
 * change — are database behaviour, not application behaviour, and a mock would
 * assert only that the mock works.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { analyticsEvents, auditEvents, invoices, transmissions } from "@/lib/db/schema";
import { formatKobo, kobo } from "@/lib/money";
import { FAKE_TRIGGERS } from "@/lib/gateway";
import {
  backoffMs,
  createInvoice,
  getInvoiceForSupplier,
  listInvoicesForSupplier,
  runDueTransmissions,
  transmitInvoice,
} from "@/lib/services/invoices";
import { makeFixture, type Fixture } from "./support/db";

let fixture: Fixture;
let actor: { type: "supplier"; id: string };

beforeEach(async () => {
  fixture = await makeFixture();
  actor = { type: "supplier", id: fixture.supplierId };
});

function draft(description = "Aluminium railings", quantity = 50, unitPrice = 3_442_000) {
  return createInvoice(
    {
      supplierId: fixture.supplierId,
      organisationId: fixture.organisationId,
      description,
      quantity,
      unitPriceKobo: kobo(unitPrice),
    },
    actor,
  );
}

describe("Given a confirmed supplier, When they create an invoice", () => {
  it("Then the totals are computed for them and stored as integer kobo", async () => {
    const invoice = await draft();

    expect(invoice.invoiceNumber).toBe("INV-0001");
    expect(formatKobo(invoice.subtotal)).toBe("1,721,000.00");
    expect(formatKobo(invoice.vat)).toBe("129,075.00");
    expect(formatKobo(invoice.total)).toBe("1,850,075.00");

    const [row] = await fixture.db.select().from(invoices).where(eq(invoices.id, invoice.id));
    expect(row.totalKobo).toBe(185_007_500);
    expect(Number.isInteger(row.totalKobo)).toBe(true);
    expect(row.status).toBe("draft");
  });

  it("Then the invoice number increments per supplier", async () => {
    await draft();
    const second = await draft();
    expect(second.invoiceNumber).toBe("INV-0002");
  });

  it("Then the creation is audited", async () => {
    const invoice = await draft();
    const events = await fixture.db
      .select()
      .from(auditEvents)
      .where(eq(auditEvents.subjectId, invoice.id));
    expect(events.map((event) => event.action)).toContain("invoice.created");
  });
});

describe("Given a valid invoice, When it is transmitted", () => {
  it("Then it comes back stamped with an IRN and the north-star event fires", async () => {
    const invoice = await draft();
    const result = await transmitInvoice(invoice.id, "key-1", actor);

    expect(result.state).toBe("stamped");
    if (result.state !== "stamped") return;
    expect(result.irn).toMatch(/^IRN-/);

    const [row] = await fixture.db.select().from(invoices).where(eq(invoices.id, invoice.id));
    expect(row.status).toBe("stamped");
    expect(row.irn).toBe(result.irn);
    expect(row.stampedAt).toBeInstanceOf(Date);

    const events = await fixture.db.select().from(analyticsEvents);
    expect(events.map((event) => event.name)).toContain("supplier_invoice_irn_issued");
  });

  it("Then the north-star event carries a bucket, never an amount", async () => {
    const invoice = await draft();
    await transmitInvoice(invoice.id, "key-bucket", actor);

    const [event] = await fixture.db
      .select()
      .from(analyticsEvents)
      .where(eq(analyticsEvents.name, "supplier_invoice_irn_issued"));

    expect(event.properties).toMatchObject({ bucket: "1m_5m" });
    expect(JSON.stringify(event.properties)).not.toContain("1850075");
  });
});

describe("Given a bad network, When the same transmission is retried", () => {
  it("Then the tax authority is never sent the invoice twice", async () => {
    const invoice = await draft();

    const first = await transmitInvoice(invoice.id, "same-key", actor);
    const second = await transmitInvoice(invoice.id, "same-key", actor);
    const third = await transmitInvoice(invoice.id, "same-key", actor);

    expect(first).toEqual(second);
    expect(second).toEqual(third);

    const rows = await fixture.db
      .select()
      .from(transmissions)
      .where(eq(transmissions.invoiceId, invoice.id));
    expect(rows).toHaveLength(1);
  });

  it("Then two different invoices can still be sent", async () => {
    const one = await draft();
    const two = await draft("Shrink wrap", 10, 18_400_00);

    const a = await transmitInvoice(one.id, "key-a", actor);
    const b = await transmitInvoice(two.id, "key-b", actor);

    expect(a.state).toBe("stamped");
    expect(b.state).toBe("stamped");
    if (a.state !== "stamped" || b.state !== "stamped") return;
    expect(a.irn).not.toBe(b.irn);
  });
});

describe("Given the NRS rejects, When the supplier is told", () => {
  it("Then a supplier-fixable fault is reported as theirs to fix", async () => {
    const invoice = await draft(`railings ${FAKE_TRIGGERS.supplierFault}`);
    const result = await transmitInvoice(invoice.id, "key-sf", actor);

    expect(result.state).toBe("rejected");
    if (result.state !== "rejected") return;
    expect(result.fault).toBe("supplier");
    expect(result.willRetry).toBe(false);
    // The reason is plain English, not a code.
    expect(result.reason).not.toMatch(/[A-Z_]{6,}/);
  });

  it("Then a buyer-fixable fault is not blamed on the supplier", async () => {
    await fixture.db
      .update(invoices)
      .set({ status: "draft" })
      .where(eq(invoices.supplierId, fixture.supplierId));

    // Repoint the buyer at a TIN the fake gateway rejects.
    const invoice = await draft();
    await fixture.db.execute(
      `update organisations set tin = '${FAKE_TRIGGERS.buyerTinRejected}-0001'`,
    );

    const result = await transmitInvoice(invoice.id, "key-bf", actor);
    expect(result.state).toBe("rejected");
    if (result.state !== "rejected") return;
    expect(result.fault).toBe("buyer");
    expect(result.offendingValue).toContain(FAKE_TRIGGERS.buyerTinRejected);
  });

  it("Then a nobody's-fault outage keeps the invoice queued with a case number", async () => {
    const invoice = await draft(`Pallet delivery ${FAKE_TRIGGERS.nrsDown}`);
    const result = await transmitInvoice(invoice.id, "key-down", actor);

    expect(result.state).toBe("rejected");
    if (result.state !== "rejected") return;
    expect(result.fault).toBe("neither");
    expect(result.willRetry).toBe(true);
    expect(result.caseNumber).toMatch(/^\d{4}$/);

    // Queued, not rejected: the supplier is not shown a final failure for
    // something that is still being retried.
    const [row] = await fixture.db.select().from(invoices).where(eq(invoices.id, invoice.id));
    expect(row.status).toBe("queued");
  });

  it("Then an unmapped code is flagged for the operator instead of falling silent", async () => {
    const invoice = await draft(`Delivery ${FAKE_TRIGGERS.unmappedCode}`);
    await transmitInvoice(invoice.id, "key-wild", actor);

    const [row] = await fixture.db
      .select()
      .from(transmissions)
      .where(eq(transmissions.invoiceId, invoice.id));
    expect(row.unmappedCode).toBe(true);
    expect(row.fault).toBe("neither");
  });

  it("Then every rejection is audited", async () => {
    const invoice = await draft(`railings ${FAKE_TRIGGERS.supplierFault}`);
    await transmitInvoice(invoice.id, "key-audit", actor);

    const events = await fixture.db
      .select()
      .from(auditEvents)
      .where(eq(auditEvents.subjectId, invoice.id));
    expect(events.map((event) => event.action)).toContain("invoice.rejected");
  });
});

describe("the retry worker", () => {
  it("backs off exponentially with jitter, and caps", () => {
    // Deterministic random so the assertion is about the curve, not the noise.
    expect(backoffMs(1, () => 1)).toBe(2_000);
    expect(backoffMs(2, () => 1)).toBe(8_000);
    expect(backoffMs(3, () => 1)).toBe(32_000);
    expect(backoffMs(10, () => 1)).toBe(15 * 60 * 1000);
    // Full jitter: never less than half, never more than the ceiling.
    expect(backoffMs(2, () => 0)).toBe(4_000);
  });

  it("picks up a queued transmission and can carry it to stamped", async () => {
    const invoice = await draft(`Pallet ${FAKE_TRIGGERS.nrsDown}`);
    await transmitInvoice(invoice.id, "key-worker", actor);

    // The outage clears: rewrite the line so the next attempt succeeds, and
    // make the attempt due now.
    await fixture.db.execute(
      `update invoice_lines set description = 'Pallet delivery' where invoice_id = '${invoice.id}'`,
    );
    await fixture.db
      .update(transmissions)
      .set({ nextAttemptAt: new Date(Date.now() - 1000) })
      .where(eq(transmissions.invoiceId, invoice.id));

    const processed = await runDueTransmissions();
    expect(processed).toBe(1);

    const [row] = await fixture.db.select().from(invoices).where(eq(invoices.id, invoice.id));
    expect(row.status).toBe("stamped");
  });
});

describe("reading invoices back", () => {
  it("scopes a supplier to their own invoices", async () => {
    const invoice = await draft();
    const found = await getInvoiceForSupplier(invoice.id, fixture.supplierId);
    expect(found?.id).toBe(invoice.id);

    const notFound = await getInvoiceForSupplier(invoice.id, "sup_someone_else");
    expect(notFound).toBeUndefined();
  });

  it("returns an empty list rather than failing on a new account", async () => {
    expect(await listInvoicesForSupplier(fixture.supplierId)).toEqual([]);
  });

  it("handles a long history", async () => {
    for (let i = 0; i < 25; i += 1) await draft(`Item ${i}`, 1, 1000);
    const list = await listInvoicesForSupplier(fixture.supplierId);
    expect(list).toHaveLength(25);
    expect(list[0].invoiceNumber).toBe("INV-0025");
  });
});
