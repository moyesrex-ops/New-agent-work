/**
 * The one interface that everything NRS-specific hides behind
 * (Architecture §16.7).
 *
 * Four implementations exist: FakeGateway (deterministic, tests and local
 * dev), HoldGateway (production without an APP — fails closed, never invents
 * an IRN), and PartnerGateway for sandbox and live accredited APP/SI.
 * Moving to direct NRS accreditation later replaces one file and nothing else.
 */
import type { Kobo } from "../money";

export type GatewayInvoiceLine = {
  description: string;
  quantity: number;
  unitPriceKobo: Kobo;
  vatBasisPoints: number;
  lineSubtotalKobo: Kobo;
  lineVatKobo: Kobo;
};

export type GatewayParty = {
  legalName: string;
  tin: string;
  address: string;
};

export type GatewayInvoice = {
  invoiceNumber: string;
  issuedAt: Date;
  currency: "NGN";
  supplier: GatewayParty;
  buyer: GatewayParty;
  lines: GatewayInvoiceLine[];
  subtotalKobo: Kobo;
  vatKobo: Kobo;
  totalKobo: Kobo;
};

export type Stamp = {
  irn: string;
  stampedAt: Date;
  /** What the QR encodes. The NRS verification URL, nothing of ours. */
  qrPayload: string;
};

/**
 * `fault` drives which of the four S10 copy variants the supplier sees, and
 * it is the only thing the UI is allowed to branch on. Raw codes never reach a
 * screen. `platform` is Stampa's own hold, never something the NRS said.
 */
export type GatewayFault = "supplier" | "buyer" | "neither" | "platform";

export class GatewayError extends Error {
  constructor(
    readonly code: string,
    readonly fault: GatewayFault,
    /** Whether an unattended retry could plausibly succeed. */
    readonly retryable: boolean,
    /** Plain-English reason, already translated. Safe to show a supplier. */
    readonly reason: string,
    /** The offending value, shown in mono so it can be read aloud to support. */
    readonly offendingValue?: string,
    /** True when the code was not in the mapping table. Raises an operator alert. */
    readonly unmapped = false,
  ) {
    super(`${code}: ${reason}`);
    this.name = "GatewayError";
  }
}

export type TransmissionStatus =
  | { state: "pending" }
  | { state: "stamped"; stamp: Stamp }
  | { state: "rejected"; error: GatewayError };

export interface EInvoiceGateway {
  readonly name: string;
  /**
   * Idempotent on `idempotencyKey`: calling twice with the same key must never
   * produce two invoices at the tax authority (Architecture §16.8).
   */
  transmit(invoice: GatewayInvoice, idempotencyKey: string): Promise<Stamp>;
  status(idempotencyKey: string): Promise<TransmissionStatus>;
  verifyUrl(irn: string): string;
}
