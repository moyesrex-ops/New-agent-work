import { describe, expect, it } from "vitest";
import { formatKobo, kobo } from "@/lib/money";
import { computeInvoiceTotals, computeLineTotals, totalsReconcile } from "@/lib/vat";

describe("VAT", () => {
  it("reproduces the worked example from the copy deck exactly", () => {
    // S6: 50 x NGN 34,420.00 -> subtotal 1,721,000.00, VAT 129,075.00,
    // total 1,850,075.00. If this ever drifts, the copy deck is wrong.
    const totals = computeInvoiceTotals([
      { description: "Aluminium railings", quantity: 50, unitPrice: kobo(3_442_000) },
    ]);

    expect(formatKobo(totals.subtotal)).toBe("1,721,000.00");
    expect(formatKobo(totals.vat)).toBe("129,075.00");
    expect(formatKobo(totals.total)).toBe("1,850,075.00");
  });

  it("treats an exempt line as a zero rate, not as a missing one", () => {
    const line = computeLineTotals({
      description: "Basic food item",
      quantity: 3,
      unitPrice: kobo(100_000),
      vatBasisPoints: 0,
    });
    expect(line.lineVat).toBe(0);
    expect(line.lineTotal).toBe(line.lineSubtotal);
    expect(line.vatBasisPoints).toBe(0);
  });

  it("rounds per line and sums, so a multi-line invoice matches the buyer's ERP", () => {
    // Each line's VAT is 0.075 -> 0.08. Rounding once at the end would give
    // 0.23 instead of 0.24, and the NRS would reject the reconciliation.
    const totals = computeInvoiceTotals([
      { description: "a", quantity: 1, unitPrice: kobo(100) },
      { description: "b", quantity: 1, unitPrice: kobo(100) },
      { description: "c", quantity: 1, unitPrice: kobo(100) },
    ]);
    expect(totals.subtotal).toBe(300);
    expect(totals.vat).toBe(24);
    expect(totals.total).toBe(324);
  });

  it("returns zeroes for an empty invoice instead of throwing", () => {
    const totals = computeInvoiceTotals([]);
    expect(totals.subtotal).toBe(0);
    expect(totals.vat).toBe(0);
    expect(totals.total).toBe(0);
  });

  it("reconciles what it computed", () => {
    const totals = computeInvoiceTotals([
      { description: "x", quantity: 7, unitPrice: kobo(123_456) },
      { description: "y", quantity: 2, unitPrice: kobo(9_999) },
    ]);
    expect(totalsReconcile(totals)).toBe(true);
  });

  it("survives a very large invoice without losing precision", () => {
    const totals = computeInvoiceTotals([
      { description: "bulk", quantity: 100_000, unitPrice: kobo(9_999_99) },
    ]);
    expect(totals.subtotal).toBe(99_999_900_000);
    expect(totals.vat).toBe(7_499_992_500);
    expect(Number.isSafeInteger(totals.total)).toBe(true);
  });
});
