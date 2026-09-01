/**
 * FakeGateway — ticket F-07, the first functional ticket in the build.
 *
 * It exists so that every downstream ticket can be built and tested before the
 * APP partner returns a sandbox credential, which the architecture review
 * named as the integration most likely to slip.
 *
 * Two rules make it useful rather than decorative:
 *   1. It is deterministic. The same invoice always produces the same IRN, so
 *      a screenshot in a ticket matches what QA sees.
 *   2. It fails on purpose. Every branch of the S10 failure screen is
 *      reachable from a seeded demo without editing code.
 */
import { totalsReconcile, computeInvoiceTotals } from "../vat";
import { nrsQrPayload } from "../nrs";
import { toGatewayError } from "./errors";
import type {
  EInvoiceGateway,
  GatewayInvoice,
  Stamp,
  TransmissionStatus,
} from "./types";

/** Excludes I, O, 0, 1 — an IRN gets read aloud over a bad phone line. */
const IRN_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

/**
 * Scripted failures, triggered by data rather than by configuration so a
 * support engineer can reproduce a supplier's exact failure in the seeded demo
 * by typing the same values.
 */
export const FAKE_TRIGGERS = {
  /** Any buyer TIN starting with this is rejected as unknown to the NRS. */
  buyerTinRejected: "10229384",
  /** A description containing this word produces a supplier-fixable rejection. */
  supplierFault: "mismatch",
  /** This word makes the NRS "unavailable" — the retryable, nobody's-fault case. */
  nrsDown: "nrsdown",
  /** This word returns a code that is deliberately absent from the mapping table. */
  unmappedCode: "wildcode",
} as const;

function hash32(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash >>> 0;
}

function block(seed: number): string {
  let value = seed;
  let out = "";
  for (let i = 0; i < 4; i += 1) {
    out += IRN_ALPHABET[value % IRN_ALPHABET.length];
    value = Math.floor(value / IRN_ALPHABET.length) + 7;
  }
  return out;
}

/** IRN-7K2M-88QX-2026, matching the shape the copy deck was written against. */
export function deterministicIrn(invoice: GatewayInvoice): string {
  const material = [
    invoice.supplier.tin,
    invoice.buyer.tin,
    invoice.invoiceNumber,
    String(invoice.totalKobo),
  ].join("|");
  const seed = hash32(material);
  return `IRN-${block(seed)}-${block(hash32(material + "salt"))}-${invoice.issuedAt.getUTCFullYear()}`;
}

export type FakeGatewayOptions = {
  /** Simulated round-trip. Zero in tests, ~1.2s in local dev to feel real. */
  latencyMs?: number;
  now?: () => Date;
};

export class FakeGateway implements EInvoiceGateway {
  readonly name = "fake";

  /** Idempotency store. In production this lives in Postgres, not in memory. */
  private readonly seen = new Map<string, TransmissionStatus>();

  constructor(private readonly options: FakeGatewayOptions = {}) {}

  verifyUrl(irn: string): string {
    return nrsQrPayload(irn);
  }

  async status(idempotencyKey: string): Promise<TransmissionStatus> {
    return this.seen.get(idempotencyKey) ?? { state: "pending" };
  }

  async transmit(invoice: GatewayInvoice, idempotencyKey: string): Promise<Stamp> {
    const previous = this.seen.get(idempotencyKey);
    if (previous?.state === "stamped") return previous.stamp;
    if (previous?.state === "rejected") throw previous.error;

    if (this.options.latencyMs) {
      await new Promise((resolve) => setTimeout(resolve, this.options.latencyMs));
    }

    const text = invoice.lines.map((line) => line.description).join(" ").toLowerCase();

    const failFor = (code: string, offending?: string): never => {
      const error = toGatewayError(code, offending);
      // Retryable failures are not cached: a retry must be allowed to succeed.
      if (!error.retryable) this.seen.set(idempotencyKey, { state: "rejected", error });
      throw error;
    };

    if (text.includes(FAKE_TRIGGERS.nrsDown)) failFor("NRS_UNAVAILABLE");
    if (text.includes(FAKE_TRIGGERS.unmappedCode)) failFor("NG-XX-999");
    if (text.includes(FAKE_TRIGGERS.supplierFault)) {
      failFor("VAT_TOTAL_MISMATCH", invoice.vatKobo.toString());
    }
    if (invoice.buyer.tin.startsWith(FAKE_TRIGGERS.buyerTinRejected)) {
      failFor("BUYER_TIN_INVALID", invoice.buyer.tin);
    }

    // The same reconciliation the NRS performs, so we reject locally what would
    // be rejected remotely.
    const recomputed = computeInvoiceTotals(
      invoice.lines.map((line) => ({
        description: line.description,
        quantity: line.quantity,
        unitPrice: line.unitPriceKobo,
        vatBasisPoints: line.vatBasisPoints,
      })),
    );
    if (
      recomputed.total !== invoice.totalKobo ||
      recomputed.vat !== invoice.vatKobo ||
      !totalsReconcile(recomputed)
    ) {
      failFor("VAT_TOTAL_MISMATCH", invoice.vatKobo.toString());
    }

    if (!/^\d{8}-\d{4}$/.test(invoice.supplier.tin)) {
      failFor("SUPPLIER_TIN_INVALID", invoice.supplier.tin);
    }

    const irn = deterministicIrn(invoice);
    const stamp: Stamp = {
      irn,
      stampedAt: this.options.now?.() ?? new Date(),
      qrPayload: this.verifyUrl(irn),
    };
    this.seen.set(idempotencyKey, { state: "stamped", stamp });
    return stamp;
  }
}
