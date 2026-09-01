import { describe, expect, it } from "vitest";
import { kobo } from "@/lib/money";
import { computeInvoiceTotals } from "@/lib/vat";
import {
  caseNumber,
  candidateIrn,
  deterministicIrn,
  FakeGateway,
  FAKE_TRIGGERS,
  formatOffendingValue,
  GatewayError,
  PartnerGateway,
  toGatewayError,
  toNrsJson,
  toUblXml,
  type GatewayInvoice,
} from "@/lib/gateway";
import { koboToDecimalString } from "@/lib/gateway/ubl";

function invoice(overrides: Partial<GatewayInvoice> = {}): GatewayInvoice {
  const totals = computeInvoiceTotals([
    { description: "Aluminium railings", quantity: 50, unitPrice: kobo(3_442_000) },
  ]);
  const [line] = totals.lines;

  return {
    invoiceNumber: "INV-0032",
    issuedAt: new Date("2026-09-14T09:42:00Z"),
    currency: "NGN",
    supplier: {
      legalName: "Emeka Aluminium Works Ltd",
      tin: "20481166-0001",
      address: "14 Ladipo Street, Oshodi, Lagos",
    },
    buyer: {
      legalName: "Agbara Foods Plc",
      tin: "20334455-0001",
      address: "Km 38 Lagos-Badagry Expressway, Agbara",
    },
    lines: [
      {
        description: "Aluminium railings",
        quantity: 50,
        unitPriceKobo: kobo(3_442_000),
        vatBasisPoints: 750,
        lineSubtotalKobo: line.lineSubtotal,
        lineVatKobo: line.lineVat,
      },
    ],
    subtotalKobo: totals.subtotal,
    vatKobo: totals.vat,
    totalKobo: totals.total,
    ...overrides,
  };
}

describe("error mapping", () => {
  it("routes each code to the fault that decides which S10 copy is shown", () => {
    expect(toGatewayError("VAT_TOTAL_MISMATCH").fault).toBe("supplier");
    expect(toGatewayError("BUYER_TIN_INVALID").fault).toBe("buyer");
    expect(toGatewayError("NRS_UNAVAILABLE").fault).toBe("neither");
  });

  it("resolves aliases, so a published-code change is not an outage", () => {
    expect(toGatewayError("NG-VAT-001").code).toBe("VAT_TOTAL_MISMATCH");
    expect(toGatewayError("503").code).toBe("NRS_UNAVAILABLE");
    expect(toGatewayError("ng-tin-002").code).toBe("BUYER_TIN_INVALID");
  });

  it("never falls silent on a code it has not seen", () => {
    const error = toGatewayError("NG-XX-999");
    expect(error.unmapped).toBe(true);
    expect(error.fault).toBe("neither");
    expect(error.retryable).toBe(true);
    expect(error.reason).toBeTruthy();
  });

  it("marks only the transient codes as retryable", () => {
    expect(toGatewayError("NRS_TIMEOUT").retryable).toBe(true);
    expect(toGatewayError("RATE_LIMITED").retryable).toBe(true);
    // A wrong TIN will be just as wrong in thirty seconds.
    expect(toGatewayError("BUYER_TIN_INVALID").retryable).toBe(false);
    expect(toGatewayError("SCHEMA_REJECTED").retryable).toBe(false);
  });

  it("gives support and the supplier the same case number", () => {
    expect(caseNumber("tx_abc123")).toBe(caseNumber("tx_abc123"));
    expect(caseNumber("tx_abc123")).toMatch(/^\d{4}$/);
  });
});

describe("FakeGateway", () => {
  it("issues the same IRN for the same invoice, every time", async () => {
    const gateway = new FakeGateway();
    const first = await gateway.transmit(invoice(), "key-1");
    const second = new FakeGateway();
    const repeat = await second.transmit(invoice(), "key-2");

    expect(first.irn).toBe(repeat.irn);
    expect(first.irn).toMatch(/^IRN-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}-2026$/);
  });

  it("gives a different IRN to a different amount", async () => {
    const other = invoice({ totalKobo: kobo(999) });
    expect(deterministicIrn(invoice())).not.toBe(deterministicIrn(other));
  });

  it("is idempotent: a repeated key never reaches the gateway twice", async () => {
    const gateway = new FakeGateway();
    const first = await gateway.transmit(invoice(), "same-key");
    const second = await gateway.transmit(invoice(), "same-key");
    expect(second.irn).toBe(first.irn);
    expect(second.stampedAt.getTime()).toBe(first.stampedAt.getTime());
  });

  it("points the QR at the NRS, not at us", async () => {
    const gateway = new FakeGateway();
    const stamp = await gateway.transmit(invoice(), "key-qr");
    expect(stamp.qrPayload).toContain("nrs.gov.ng");
    expect(stamp.qrPayload).toContain(stamp.irn);
  });

  it("reaches every branch of the failure screen from seeded data", async () => {
    const gateway = new FakeGateway();

    const supplierFault = invoice({
      lines: [{ ...invoice().lines[0], description: `railings ${FAKE_TRIGGERS.supplierFault}` }],
    });
    await expect(gateway.transmit(supplierFault, "k1")).rejects.toMatchObject({
      fault: "supplier",
    });

    const buyerFault = invoice({
      buyer: { ...invoice().buyer, tin: `${FAKE_TRIGGERS.buyerTinRejected}-0001` },
    });
    await expect(gateway.transmit(buyerFault, "k2")).rejects.toMatchObject({ fault: "buyer" });

    const down = invoice({
      lines: [{ ...invoice().lines[0], description: FAKE_TRIGGERS.nrsDown }],
    });
    await expect(gateway.transmit(down, "k3")).rejects.toMatchObject({
      fault: "neither",
      retryable: true,
    });
  });

  it("lets a retryable failure succeed on a later attempt", async () => {
    const gateway = new FakeGateway();
    const down = invoice({
      lines: [{ ...invoice().lines[0], description: FAKE_TRIGGERS.nrsDown }],
    });
    await expect(gateway.transmit(down, "k4")).rejects.toBeInstanceOf(GatewayError);
    // Same key, the transient condition cleared: this must not be cached as
    // a permanent rejection.
    const stamp = await gateway.transmit(invoice(), "k4");
    expect(stamp.irn).toBeTruthy();
  });

  it("catches locally what the NRS would reject remotely", async () => {
    const gateway = new FakeGateway();
    const wrong = invoice({ vatKobo: kobo(1) });
    await expect(gateway.transmit(wrong, "k5")).rejects.toMatchObject({
      code: "VAT_TOTAL_MISMATCH",
    });
  });
});

describe("UBL mapping", () => {
  it("serialises kobo without ever touching a float", () => {
    expect(koboToDecimalString(kobo(185_007_500))).toBe("1850075.00");
    expect(koboToDecimalString(kobo(5))).toBe("0.05");
    expect(koboToDecimalString(kobo(0))).toBe("0.00");
  });

  it("emits amounts that reconcile with the totals", () => {
    const xml = toUblXml(invoice());
    expect(xml).toContain("<cbc:TaxAmount currencyID=\"NGN\">129075.00</cbc:TaxAmount>");
    expect(xml).toContain("<cbc:PayableAmount currencyID=\"NGN\">1850075.00</cbc:PayableAmount>");
    expect(xml).toContain("<cbc:ID>INV-0032</cbc:ID>");
    expect(xml).toContain("<cbc:IssueDate>2026-09-14</cbc:IssueDate>");
  });

  it("escapes a company name that contains XML syntax", () => {
    const xml = toUblXml(
      invoice({ supplier: { legalName: "Smith & Sons <Nig> Ltd", tin: "1", address: "a" } }),
    );
    expect(xml).toContain("Smith &amp; Sons &lt;Nig&gt; Ltd");
    expect(xml).not.toContain("<Nig>");
  });

  it("marks an exempt line as category E rather than omitting the tax block", () => {
    const exempt = invoice();
    exempt.lines[0].vatBasisPoints = 0;
    const xml = toUblXml(exempt);
    expect(xml).toContain("<cbc:ID>E</cbc:ID>");
    expect(xml).toContain("<cbc:Percent>0.00</cbc:Percent>");
  });
});

describe("Given a rejection carries the value the NRS objected to", () => {
  it("Then a money value is rendered as money, not as raw kobo", () => {
    // The wire carries an integer number of kobo. Printing it verbatim told a
    // supplier their VAT figure was "1020000", which is not a number anyone
    // recognises as their own.
    expect(formatOffendingValue("VAT_TOTAL_MISMATCH", "1020000")).toBe("NGN 10,200.00");
    expect(formatOffendingValue("NG-VAT-001", "1020000")).toBe("NGN 10,200.00");
    expect(formatOffendingValue("LINE_TOTAL_MISMATCH", "0")).toBe("NGN 0.00");
  });

  it("Then a value we cannot interpret is passed through untouched", () => {
    // A TIN is already readable. Guessing at a format we do not understand
    // would be worse than printing what arrived.
    expect(formatOffendingValue("BUYER_TIN_INVALID", "10229384-0001")).toBe("10229384-0001");
    expect(formatOffendingValue("UNKNOWN_CODE", "1020000")).toBe("1020000");
    expect(formatOffendingValue("VAT_TOTAL_MISMATCH", "not-a-number")).toBe("not-a-number");
  });
});

describe("NRS JSON mapping", () => {
  it("builds the Interswitch IRN candidate from invoice number, service id and date", () => {
    expect(candidateIrn("INV-0032", "STAMPA", new Date("2026-09-14T09:42:00Z"))).toBe(
      "INV0032-STAMPA-20260914",
    );
  });

  it("sends naira decimals produced from kobo, never a float in storage", () => {
    const payload = toNrsJson(invoice(), { businessId: "biz-1", serviceId: "STAMPA" });
    expect(payload.business_id).toBe("biz-1");
    expect(payload.irn).toBe("INV0032-STAMPA-20260914");
    expect(payload.legal_monetary_total.payable_amount).toBe(1850075);
    expect(payload.tax_total[0].tax_amount).toBe(129075);
    expect(payload.accounting_supplier_party.tin).toBe("20481166-0001");
  });
});

describe("PartnerGateway", () => {
  it("signs via SwitchTax and stores the partner IRN, never inventing one", async () => {
    const calls: string[] = [];
    const fetchFn: typeof fetch = async (input, init) => {
      const url = String(input);
      calls.push(`${init?.method ?? "GET"} ${url}`);
      if (url.endsWith("/Api/SwitchTax/Token")) {
        return new Response(JSON.stringify({ Token: "tok", expires_in: 3600 }), { status: 200 });
      }
      if (url.endsWith("/Api/SwitchTax/SignInvoice")) {
        return new Response(
          JSON.stringify({
            Code: 201,
            data: { IRN: "NRS-REAL-1", QRCodeData: "https://nrs.gov.ng/verify/NRS-REAL-1" },
          }),
          { status: 201 },
        );
      }
      if (url.endsWith("/Api/SwitchTax/Transmit")) {
        return new Response(JSON.stringify({ Code: 200 }), { status: 200 });
      }
      return new Response("no", { status: 500 });
    };

    const gateway = new PartnerGateway({
      baseUrl: "https://partner.example.ng",
      clientId: "id",
      clientSecret: "secret",
      businessId: "biz-1",
      serviceId: "STAMPA",
      fetch: fetchFn,
      now: () => new Date("2026-09-14T09:42:00Z"),
    });

    const stamp = await gateway.transmit(invoice(), "key-live");
    expect(stamp.irn).toBe("NRS-REAL-1");
    expect(stamp.qrPayload).toContain("nrs.gov.ng");
    expect(calls.some((line) => line.includes("SignInvoice"))).toBe(true);
    expect(calls.some((line) => line.includes("Token"))).toBe(true);

    const again = await gateway.transmit(invoice(), "key-live");
    expect(again.irn).toBe("NRS-REAL-1");
    expect(calls.filter((line) => line.includes("SignInvoice"))).toHaveLength(1);
  });

  it("falls back to postInvoice when SignInvoice is not on that partner", async () => {
    const fetchFn: typeof fetch = async (input) => {
      const url = String(input);
      if (url.endsWith("/Api/SwitchTax/Token")) {
        return new Response(JSON.stringify({ Token: "tok" }), { status: 200 });
      }
      if (url.endsWith("/Api/SwitchTax/SignInvoice")) {
        return new Response("not found", { status: 404 });
      }
      if (url.endsWith("/Api/SwitchTax/postInvoice")) {
        return new Response(JSON.stringify({ data: { IRN: "POST-1" } }), { status: 200 });
      }
      if (url.endsWith("/Api/SwitchTax/Transmit")) {
        return new Response("", { status: 404 });
      }
      return new Response("no", { status: 500 });
    };

    const gateway = new PartnerGateway({
      baseUrl: "https://digitax.example.ng",
      clientId: "id",
      clientSecret: "secret",
      businessId: "biz-1",
      serviceId: "STAMPA",
      fetch: fetchFn,
    });
    const stamp = await gateway.transmit(invoice(), "key-post");
    expect(stamp.irn).toBe("POST-1");
  });

  it("does not invent an IRN when the partner omits one", async () => {
    const fetchFn: typeof fetch = async (input) => {
      const url = String(input);
      if (url.endsWith("/Api/SwitchTax/Token")) {
        return new Response(JSON.stringify({ Token: "tok" }), { status: 200 });
      }
      return new Response(JSON.stringify({ Code: 200, data: {} }), { status: 200 });
    };
    const gateway = new PartnerGateway({
      baseUrl: "https://partner.example.ng",
      clientId: "id",
      clientSecret: "secret",
      businessId: "biz-1",
      serviceId: "STAMPA",
      fetch: fetchFn,
    });
    await expect(gateway.transmit(invoice(), "key-empty")).rejects.toMatchObject({
      code: "NRS_UNAVAILABLE",
    });
  });
});

