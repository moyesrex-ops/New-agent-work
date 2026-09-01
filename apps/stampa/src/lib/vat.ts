/**
 * Nigerian VAT. The supplier never types a VAT figure — we compute it and show
 * it (screen S6). That is a trust decision as much as a usability one: the
 * most common NRS rejection is a VAT total that does not reconcile with the
 * line items, and it is not the supplier's arithmetic to get wrong.
 */
import { addKobo, applyBasisPoints, Kobo, multiplyKobo, ZERO } from "./money";

/** 7.5%, expressed in basis points so the rate is an integer too. */
export const STANDARD_VAT_BASIS_POINTS = 750;

/** Exempt supplies still transmit; they carry a zero rate, not a missing one. */
export const EXEMPT_VAT_BASIS_POINTS = 0;

export type InvoiceLineInput = {
  description: string;
  quantity: number;
  unitPrice: Kobo;
  vatBasisPoints?: number;
};

export type LineTotals = {
  lineSubtotal: Kobo;
  lineVat: Kobo;
  lineTotal: Kobo;
  vatBasisPoints: number;
};

export type InvoiceTotals = {
  lines: LineTotals[];
  subtotal: Kobo;
  vat: Kobo;
  total: Kobo;
};

/**
 * VAT is computed and rounded per line, then summed. Summing first and
 * rounding once would drift from the buyer's ERP on multi-line invoices, and
 * the buyer's number is the one that gets filed.
 */
export function computeLineTotals(line: InvoiceLineInput): LineTotals {
  const vatBasisPoints = line.vatBasisPoints ?? STANDARD_VAT_BASIS_POINTS;
  const lineSubtotal = multiplyKobo(line.unitPrice, line.quantity);
  const lineVat = applyBasisPoints(lineSubtotal, vatBasisPoints);
  return {
    lineSubtotal,
    lineVat,
    lineTotal: addKobo(lineSubtotal, lineVat),
    vatBasisPoints,
  };
}

export function computeInvoiceTotals(lines: InvoiceLineInput[]): InvoiceTotals {
  const computed = lines.map(computeLineTotals);
  const subtotal = computed.length ? addKobo(...computed.map((l) => l.lineSubtotal)) : ZERO;
  const vat = computed.length ? addKobo(...computed.map((l) => l.lineVat)) : ZERO;
  return { lines: computed, subtotal, vat, total: addKobo(subtotal, vat) };
}

/**
 * The reconciliation the NRS performs on receipt. We run it before
 * transmitting so a rejection that we could have predicted never reaches the
 * supplier as a failure screen.
 */
export function totalsReconcile(totals: InvoiceTotals): boolean {
  const recomputed = computeInvoiceTotals(
    totals.lines.map((line) => ({
      description: "",
      quantity: 1,
      unitPrice: line.lineSubtotal,
      vatBasisPoints: line.vatBasisPoints,
    })),
  );
  return recomputed.subtotal === totals.subtotal && recomputed.vat === totals.vat;
}
