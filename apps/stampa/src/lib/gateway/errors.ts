/**
 * The error-code mapping table (ticket C-03).
 *
 * Partner and NRS codes are translated here, once. Every screen downstream
 * branches on `fault`, never on a code, which is what keeps the three S10 copy
 * variants from multiplying into thirty.
 *
 * An unmapped code does not fall silent: it becomes a "neither" fault with a
 * case number and raises an operator alert (Architecture §16.7).
 */
import { formatNaira, kobo } from "../money";
import { GatewayError, type GatewayFault } from "./types";

type Mapping = {
  fault: GatewayFault;
  retryable: boolean;
  /** Written for a supplier reading it on a phone, not for an engineer. */
  reason: string;
  /**
   * How to render the value the NRS objected to.
   *
   * Money arrives from the wire as an integer number of kobo, which is the
   * right thing to store and the wrong thing to print: a supplier told their
   * VAT figure is "1020000" learns nothing and distrusts everything.
   */
  valueKind?: "money" | "text";
};

/**
 * Codes follow the partner's published list. Where their list and the NRS list
 * disagree we map both spellings to the same entry, because discovering that
 * mid-incident is not a plan.
 */
export const ERROR_MAP: Record<string, Mapping> = {
  // ---- The supplier can fix this themselves ----
  VAT_TOTAL_MISMATCH: {
    fault: "supplier",
    retryable: false,
    reason: "the VAT total does not match the line items",
    valueKind: "money",
  },
  LINE_TOTAL_MISMATCH: {
    fault: "supplier",
    retryable: false,
    reason: "the invoice total does not match the line items",
    valueKind: "money",
  },
  DUPLICATE_INVOICE_NUMBER: {
    fault: "supplier",
    retryable: false,
    reason: "this invoice number has already been used",
  },
  INVALID_DESCRIPTION: {
    fault: "supplier",
    retryable: false,
    reason: "the description of what you supplied is not accepted",
  },
  SUPPLIER_TIN_INVALID: {
    fault: "supplier",
    retryable: false,
    reason: "your TIN is not recognised",
  },
  SUPPLIER_TIN_INACTIVE: {
    fault: "supplier",
    retryable: false,
    reason: "your TIN is registered but not active",
  },

  // ---- Only the buyer can fix this ----
  BUYER_TIN_INVALID: {
    fault: "buyer",
    retryable: false,
    reason: "the NRS does not recognise your customer's TIN",
  },
  BUYER_TIN_INACTIVE: {
    fault: "buyer",
    retryable: false,
    reason: "your customer's TIN is not active",
  },
  BUYER_NOT_REGISTERED: {
    fault: "buyer",
    retryable: false,
    reason: "your customer is not registered for e-invoicing yet",
  },

  // ---- Neither side can fix this ----
  NRS_UNAVAILABLE: {
    fault: "neither",
    retryable: true,
    reason: "the NRS is not responding",
  },
  NRS_TIMEOUT: {
    fault: "neither",
    retryable: true,
    reason: "the NRS did not respond in time",
  },
  RATE_LIMITED: {
    fault: "neither",
    retryable: true,
    reason: "we are being asked to slow down",
  },
  SCHEMA_REJECTED: {
    fault: "neither",
    retryable: false,
    reason: "the NRS rejected the format of the message",
  },
  PARTNER_AUTH_FAILED: {
    fault: "neither",
    retryable: false,
    reason: "we could not connect to the transmission service",
  },
};

/** Aliases for the same condition under a different published spelling. */
const ALIASES: Record<string, string> = {
  "NG-VAT-001": "VAT_TOTAL_MISMATCH",
  "NG-TIN-002": "BUYER_TIN_INVALID",
  "NG-TIN-003": "SUPPLIER_TIN_INVALID",
  "NG-DUP-001": "DUPLICATE_INVOICE_NUMBER",
  "503": "NRS_UNAVAILABLE",
  "504": "NRS_TIMEOUT",
  "429": "RATE_LIMITED",
  "401": "PARTNER_AUTH_FAILED",
};

export function resolveCode(rawCode: string): string {
  const code = (rawCode ?? "").trim().toUpperCase();
  return ALIASES[code] ?? ALIASES[rawCode] ?? code;
}

/**
 * Turn whatever the partner said into something a supplier can act on.
 *
 * The `unmapped` flag is the important output. It means a code exists in
 * production that we have never seen, which is an operator alert and a mapping
 * table update — not a shrug.
 */
export function toGatewayError(
  rawCode: string,
  offendingValue?: string,
): GatewayError {
  const code = resolveCode(rawCode);
  const mapping = ERROR_MAP[code];

  if (!mapping) {
    return new GatewayError(
      code || "UNKNOWN",
      "neither",
      true,
      "the NRS returned something we have not seen before",
      offendingValue,
      true,
    );
  }

  return new GatewayError(code, mapping.fault, mapping.retryable, mapping.reason, offendingValue);
}

/** Operator-facing text for a stored code. Never shown to a supplier. */
export function describeCode(rawCode: string): string {
  const code = resolveCode(rawCode);
  return ERROR_MAP[code]?.reason ?? "an error code we have not mapped yet";
}

/**
 * The value the NRS objected to, in the form the supplier recognises it.
 *
 * Anything we cannot confidently interpret is passed through untouched. A TIN
 * or an invoice number is already readable; guessing at a format we do not
 * understand would be worse than printing what arrived.
 */
export function formatOffendingValue(rawCode: string, value: string): string {
  const kind = ERROR_MAP[resolveCode(rawCode)]?.valueKind;
  if (kind !== "money") return value;

  const asKobo = Number(value);
  if (!Number.isSafeInteger(asKobo)) return value;
  return formatNaira(kobo(asKobo));
}

/**
 * A short, stable case number for the "neither" copy variant. Derived from the
 * transmission id so support and the supplier are always looking at the same
 * four digits.
 */
export function caseNumber(transmissionId: string): string {
  let hash = 0;
  for (const char of transmissionId) {
    hash = (hash * 31 + char.charCodeAt(0)) % 9000;
  }
  return String(1000 + hash);
}
