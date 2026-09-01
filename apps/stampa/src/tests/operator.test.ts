/**
 * Operator console tests (Phase 18, tickets O-01..O-06).
 *
 * The operator console is the largest concentration of power in the system, so
 * the properties under test are the limits rather than the features: a read is
 * audited, a write without a reason fails, a retry cannot duplicate a tax
 * record, and suspension deletes nothing.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { auditEvents, invoices, suppliers, transmissions } from "@/lib/db/schema";
import { kobo } from "@/lib/money";
import { FAKE_TRIGGERS } from "@/lib/gateway";
import { createInvoice, transmitInvoice } from "@/lib/services/invoices";
import {
  auditTrail,
  correctTin,
  failureQueue,
  lookup,
  metrics,
  openSupplierRecord,
  raiseFlag,
  resolveFlag,
  retryGroup,
  retryTransmission,
} from "@/lib/services/operator";
import { makeFixture, type Fixture } from "./support/db";
import { installFakeMessengers } from "./support/messaging";

const OPERATOR = "ops@stampa.ng";

let fixture: Fixture;
let actor: { type: "supplier"; id: string };

beforeEach(async () => {
  fixture = await makeFixture();
  actor = { type: "supplier", id: fixture.supplierId };
  installFakeMessengers();
});

function draft(description = "Aluminium railings") {
  return createInvoice(
    {
      supplierId: fixture.supplierId,
      organisationId: fixture.organisationId,
      description,
      quantity: 50,
      unitPriceKobo: kobo(3_442_000),
    },
    actor,
  );
}

describe("O1 metrics", () => {
  it("counts the north star, not invoices created", async () => {
    await draft();
    expect((await metrics()).stampedToday).toBe(0);

    const invoice = await draft("Shrink wrap");
    await transmitInvoice(invoice.id, "ops-metrics", actor);

    const now = await metrics();
    expect(now.stampedToday).toBe(1);
    expect(now.stampedThisWeek).toBe(1);
  });

  it("reports an empty system as zeroes rather than failing", async () => {
    const empty = await metrics();
    expect(empty).toMatchObject({ stampedToday: 0, queued: 0, failing: 0 });
  });
});

describe("O2 failure queue", () => {
  it("groups failures by code so one fix covers the batch", async () => {
    for (const key of ["a", "b", "c"]) {
      const invoice = await draft(`railings ${FAKE_TRIGGERS.supplierFault} ${key}`);
      await transmitInvoice(invoice.id, `ops-group-${key}`, actor);
    }

    const groups = await failureQueue();
    expect(groups).toHaveLength(1);
    expect(groups[0].count).toBe(3);
    // Operator-facing text, not a raw code, and not the supplier's copy either.
    expect(groups[0].reason).toBeTruthy();
  });

  it("puts unmapped codes at the top, because nobody has looked at those", async () => {
    const known = await draft(`railings ${FAKE_TRIGGERS.supplierFault}`);
    await transmitInvoice(known.id, "ops-known", actor);
    const wild = await draft(`Delivery ${FAKE_TRIGGERS.unmappedCode}`);
    await transmitInvoice(wild.id, "ops-wild", actor);

    const groups = await failureQueue();
    expect(groups[0].rows[0].unmappedCode).toBe(true);
  });

  it("is empty on a healthy system", async () => {
    const invoice = await draft();
    await transmitInvoice(invoice.id, "ops-clean", actor);
    expect(await failureQueue()).toEqual([]);
  });
});

describe("O2 retry", () => {
  it("reuses the idempotency key, so a retry cannot become a second tax record", async () => {
    const invoice = await draft(`Pallet ${FAKE_TRIGGERS.nrsDown}`);
    await transmitInvoice(invoice.id, "ops-retry", actor);

    const [before] = await fixture.db
      .select()
      .from(transmissions)
      .where(eq(transmissions.invoiceId, invoice.id));

    await fixture.db.execute(
      `update invoice_lines set description = 'Pallet delivery' where invoice_id = '${invoice.id}'`,
    );
    await retryTransmission(before.id, OPERATOR, "buyer confirmed the NRS is back up");

    const after = await fixture.db
      .select()
      .from(transmissions)
      .where(eq(transmissions.invoiceId, invoice.id));
    expect(after).toHaveLength(1);
    expect(after[0].idempotencyKey).toBe(before.idempotencyKey);

    const [row] = await fixture.db.select().from(invoices).where(eq(invoices.id, invoice.id));
    expect(row.status).toBe("stamped");
  });

  it("refuses to retry without a reason", async () => {
    const invoice = await draft(`railings ${FAKE_TRIGGERS.supplierFault}`);
    await transmitInvoice(invoice.id, "ops-noreason", actor);
    const [row] = await fixture.db
      .select()
      .from(transmissions)
      .where(eq(transmissions.invoiceId, invoice.id));

    await expect(retryTransmission(row.id, OPERATOR, "  ")).rejects.toThrow(/requires a reason/);
  });

  it("retries a whole group in one action", async () => {
    for (const key of ["a", "b"]) {
      const invoice = await draft(`Pallet ${FAKE_TRIGGERS.nrsDown} ${key}`);
      await transmitInvoice(invoice.id, `ops-bulk-${key}`, actor);
    }

    const [group] = await failureQueue();
    const retried = await retryGroup(group.code, OPERATOR, "NRS status page says recovered");
    expect(retried).toBe(2);
  });
});

describe("O3 lookup", () => {
  it("finds a supplier by phone, by name and by TIN", async () => {
    expect((await lookup("0803 000 0001")).map((hit) => hit.kind)).toContain("supplier");
    expect((await lookup("Emeka")).map((hit) => hit.kind)).toContain("supplier");
    expect((await lookup("20481166-0001")).map((hit) => hit.kind)).toContain("supplier");
  });

  it("finds an invoice by number and by IRN", async () => {
    const invoice = await draft();
    const result = await transmitInvoice(invoice.id, "ops-lookup", actor);
    if (result.state !== "stamped") throw new Error("expected a stamp");

    expect((await lookup("INV-0001")).some((hit) => hit.kind === "invoice")).toBe(true);
    expect((await lookup(result.irn)).some((hit) => hit.kind === "invoice")).toBe(true);
  });

  it("does not run on a two-character search", async () => {
    expect(await lookup("Em")).toEqual([]);
  });
});

describe("O4 record view", () => {
  it("writes an audit row before the record is read", async () => {
    await openSupplierRecord(fixture.supplierId, OPERATOR, "supplier called about INV-0001");

    const events = await fixture.db
      .select()
      .from(auditEvents)
      .where(eq(auditEvents.subjectId, fixture.supplierId));
    const view = events.find((event) => event.action === "operator.record_viewed");

    expect(view).toBeDefined();
    expect(view?.actorId).toBe(OPERATOR);
    expect(view?.reason).toBe("supplier called about INV-0001");
  });

  it("refuses to open a record without a reason", async () => {
    await expect(openSupplierRecord(fixture.supplierId, OPERATOR, "")).rejects.toThrow(
      /requires a reason/,
    );
  });
});

describe("O4 TIN correction", () => {
  it("records the old and new value", async () => {
    const result = await correctTin(
      fixture.supplierId,
      "20481166 0002",
      OPERATOR,
      "typo confirmed with the supplier by phone",
    );
    expect(result.ok).toBe(true);

    const [row] = await fixture.db
      .select()
      .from(suppliers)
      .where(eq(suppliers.id, fixture.supplierId));
    expect(row.tin).toBe("20481166-0002");

    const events = await fixture.db
      .select()
      .from(auditEvents)
      .where(eq(auditEvents.subjectId, fixture.supplierId));
    const correction = events.find((event) => event.action === "operator.tin_corrected");
    expect(correction?.before).toMatchObject({ tin: "20481166-0001" });
    expect(correction?.after).toMatchObject({ tin: "20481166-0002" });
  });

  it("rejects a malformed TIN without touching the record", async () => {
    const result = await correctTin(fixture.supplierId, "not-a-tin", OPERATOR, "cleaning up data");
    expect(result.ok).toBe(false);

    const [row] = await fixture.db
      .select()
      .from(suppliers)
      .where(eq(suppliers.id, fixture.supplierId));
    expect(row.tin).toBe("20481166-0001");
  });
});

describe("O5 flags", () => {
  it("suspends without deleting anything", async () => {
    const invoice = await draft();
    await transmitInvoice(invoice.id, "ops-flag", actor);

    const flagId = await raiseFlag({
      subjectType: "supplier",
      subjectId: fixture.supplierId,
      reason: "buyer reports the invoices are not theirs",
      raisedBy: OPERATOR,
    });
    await resolveFlag(flagId, "suspend", OPERATOR, "confirmed impersonation with the buyer");

    const [supplier] = await fixture.db
      .select()
      .from(suppliers)
      .where(eq(suppliers.id, fixture.supplierId));
    expect(supplier.suspendedAt).toBeInstanceOf(Date);
    expect(supplier.deletedAt).toBeNull();

    // The stamped invoice is a tax record and survives the suspension.
    const [row] = await fixture.db.select().from(invoices).where(eq(invoices.id, invoice.id));
    expect(row.status).toBe("stamped");
  });

  it("dismissing leaves the supplier untouched", async () => {
    const flagId = await raiseFlag({
      subjectType: "supplier",
      subjectId: fixture.supplierId,
      reason: "duplicate report",
      raisedBy: OPERATOR,
    });
    await resolveFlag(flagId, "dismiss", OPERATOR, "same report as yesterday, already checked");

    const [supplier] = await fixture.db
      .select()
      .from(suppliers)
      .where(eq(suppliers.id, fixture.supplierId));
    expect(supplier.suspendedAt).toBeNull();
  });

  it("refuses to resolve without a reason", async () => {
    const flagId = await raiseFlag({
      subjectType: "supplier",
      subjectId: fixture.supplierId,
      reason: "reported",
      raisedBy: OPERATOR,
    });
    await expect(resolveFlag(flagId, "suspend", OPERATOR, "")).rejects.toThrow(
      /requires a reason/,
    );
  });
});

describe("O6 audit log", () => {
  it("returns newest first", async () => {
    await draft();
    await correctTin(fixture.supplierId, "20481166-0009", OPERATOR, "correcting after a call");

    const trail = await auditTrail();
    expect(trail[0].action).toBe("operator.tin_corrected");
  });
});
