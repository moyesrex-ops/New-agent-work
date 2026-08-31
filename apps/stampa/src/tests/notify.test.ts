/**
 * Notification tests (Phase 18, tickets N-02, N-03, N-04).
 *
 * The properties worth asserting are the ones a supplier would notice: the
 * message names the invoice and says what to do, it never arrives twice, a
 * failure that is about to be retried stays quiet, and WhatsApp going down
 * does not mean silence.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { invitations, invoices, notifications, supplierLinks } from "@/lib/db/schema";
import { kobo } from "@/lib/money";
import { FAKE_TRIGGERS } from "@/lib/gateway";
import { createInvoice, transmitInvoice } from "@/lib/services/invoices";
import { sendDueNudges } from "@/lib/services/notify";
import { makeFixture, type Fixture } from "./support/db";
import { installFakeMessengers } from "./support/messaging";

const SUPPLIER_PHONE = "+2348030000001";

let fixture: Fixture;
let actor: { type: "supplier"; id: string };
let channels: ReturnType<typeof installFakeMessengers>;

beforeEach(async () => {
  fixture = await makeFixture();
  actor = { type: "supplier", id: fixture.supplierId };
  channels = installFakeMessengers();
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

describe("Given an invoice is stamped, When the supplier is notified", () => {
  it("Then the message carries the invoice, the buyer, the amount and the IRN", async () => {
    const invoice = await draft();
    const result = await transmitInvoice(invoice.id, "notify-1", actor);
    expect(result.state).toBe("stamped");

    expect(channels.whatsapp.sent).toHaveLength(1);
    const [message] = channels.whatsapp.sent;
    expect(message.to).toBe(SUPPLIER_PHONE);
    expect(message.body).toContain("INV-0001");
    expect(message.body).toContain("Agbara Foods Plc");
    expect(message.body).toContain("1,850,075.00");
    expect(message.body).toContain("IRN-");
  });

  it("Then it deep-links to the invoice, never to a generic inbox", async () => {
    const invoice = await draft();
    await transmitInvoice(invoice.id, "notify-2", actor);

    const [message] = channels.whatsapp.sent;
    expect(message.link).toContain(`/s/invoice/${invoice.id}`);
    expect(message.body).not.toMatch(/you have an update/i);
  });

  it("Then a replayed transmission does not send the message twice", async () => {
    const invoice = await draft();
    await transmitInvoice(invoice.id, "notify-3", actor);
    await transmitInvoice(invoice.id, "notify-3", actor);
    await transmitInvoice(invoice.id, "notify-3", actor);

    expect(channels.whatsapp.sent).toHaveLength(1);
  });
});

describe("Given WhatsApp refuses the number, When a notification goes out", () => {
  it("Then it arrives by SMS instead of not arriving", async () => {
    channels = installFakeMessengers({ whatsapp: [SUPPLIER_PHONE] });

    const invoice = await draft();
    await transmitInvoice(invoice.id, "notify-fallback", actor);

    expect(channels.whatsapp.sent).toHaveLength(0);
    expect(channels.sms.sent).toHaveLength(1);
    expect(channels.sms.sent[0].body).toContain("INV-0001");

    const [row] = await fixture.db.select().from(notifications);
    expect(row.state).toBe("sent");
    expect(row.channel).toBe("sms");
  });
});

describe("Given a transmission fails, When the supplier is notified", () => {
  it("Then a supplier-fixable rejection tells them what to fix", async () => {
    const invoice = await draft(`railings ${FAKE_TRIGGERS.supplierFault}`);
    await transmitInvoice(invoice.id, "notify-sf", actor);

    const [message] = channels.whatsapp.sent;
    expect(message.template).toBe("invoice_rejected_supplier");
    expect(message.body).toContain("INV-0001");
    expect(message.body).toContain("Nothing is lost.");
  });

  it("Then a buyer-fixable rejection does not blame the supplier", async () => {
    const invoice = await draft();
    await fixture.db.execute(
      `update organisations set tin = '${FAKE_TRIGGERS.buyerTinRejected}-0001'`,
    );
    await transmitInvoice(invoice.id, "notify-bf", actor);

    const [message] = channels.whatsapp.sent;
    expect(message.body).toContain("not yours");
    expect(message.body).toContain("Agbara Foods Plc");
  });

  it("Then a failure that will be retried says nothing at all", async () => {
    const invoice = await draft(`Pallet ${FAKE_TRIGGERS.nrsDown}`);
    const result = await transmitInvoice(invoice.id, "notify-quiet", actor);

    expect(result.state).toBe("rejected");
    expect(result.state === "rejected" && result.willRetry).toBe(true);
    expect(channels.whatsapp.sent).toHaveLength(0);
    expect(channels.sms.sent).toHaveLength(0);
  });
});

describe("Given a supplier opened an invite three days ago and stopped", () => {
  async function ageTheInvitation(days: number) {
    const when = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    await fixture.db
      .update(invitations)
      .set({ openedAt: when })
      .where(eq(invitations.supplierLinkId, fixture.linkId));
  }

  it("Then they are nudged once, with a link back to where they stopped", async () => {
    await ageTheInvitation(4);

    expect(await sendDueNudges()).toBe(1);
    const [message] = channels.whatsapp.sent;
    expect(message.template).toBe("invite_nudge");
    expect(message.link).toContain(`/s/i/${fixture.code}`);

    // Running the job again must not produce a second message.
    expect(await sendDueNudges()).toBe(0);
    expect(channels.whatsapp.sent).toHaveLength(1);
  });

  it("Then a supplier who opened it yesterday is left alone", async () => {
    await ageTheInvitation(1);
    expect(await sendDueNudges()).toBe(0);
  });

  it("Then a supplier who never opened it is left to the buyer", async () => {
    expect(await sendDueNudges()).toBe(0);
  });

  it("Then a supplier who finished is not chased", async () => {
    await ageTheInvitation(4);
    await fixture.db
      .update(supplierLinks)
      .set({ status: "live" })
      .where(eq(supplierLinks.id, fixture.linkId));

    expect(await sendDueNudges()).toBe(0);
  });
});

describe("notification failure never breaks the money path", () => {
  it("stamps the invoice even when both channels refuse", async () => {
    installFakeMessengers({ whatsapp: [SUPPLIER_PHONE], sms: [SUPPLIER_PHONE] });

    const invoice = await draft();
    const result = await transmitInvoice(invoice.id, "notify-dead", actor);

    expect(result.state).toBe("stamped");
    const [row] = await fixture.db.select().from(invoices).where(eq(invoices.id, invoice.id));
    expect(row.status).toBe("stamped");

    const [record] = await fixture.db.select().from(notifications);
    expect(record.state).toBe("failed");
  });
});
