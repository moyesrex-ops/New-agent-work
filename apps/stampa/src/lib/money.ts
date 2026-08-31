/**
 * Money is an integer number of kobo. Always. There is no float path in this
 * file and there must not be one anywhere else (Architecture §16.2).
 *
 * A rounding discrepancy in a VAT figure is a rejected invoice and an unpaid
 * supplier, so every operation here is exact integer arithmetic and every
 * rounding decision is explicit.
 */

declare const kobaBrand: unique symbol;

/** An integer number of kobo. 100 kobo = NGN 1.00. */
export type Kobo = number & { readonly [kobaBrand]: "kobo" };

/** Naira are never represented as a number. Largest amount we accept: NGN 10bn. */
export const MAX_KOBO = 1_000_000_000_000 as Kobo;

/** Above this we ask the supplier to confirm before sending (screen S6). */
export const CONFIRM_ABOVE_KOBO = 10_000_000_000 as Kobo;

export function kobo(value: number): Kobo {
  if (!Number.isSafeInteger(value)) {
    throw new TypeError(`Kobo must be a safe integer, received ${value}`);
  }
  return value as Kobo;
}

export const ZERO = kobo(0);

export function addKobo(...values: Kobo[]): Kobo {
  return kobo(values.reduce<number>((sum, value) => sum + value, 0));
}

/**
 * Quantity is a whole number of units, so this stays exact. Fractional
 * quantities are deliberately not supported in P0 — see the cut list.
 */
export function multiplyKobo(unitPrice: Kobo, quantity: number): Kobo {
  if (!Number.isSafeInteger(quantity) || quantity < 0) {
    throw new TypeError(`Quantity must be a non-negative integer, received ${quantity}`);
  }
  return kobo(unitPrice * quantity);
}

/**
 * Multiply by a rate expressed in basis points, rounding half away from zero.
 *
 * Half away from zero is the convention the FIRS uses for VAT and it is what a
 * buyer's ERP will compute, so any other choice produces a mismatch the
 * supplier gets blamed for.
 */
export function applyBasisPoints(amount: Kobo, basisPoints: number): Kobo {
  if (!Number.isSafeInteger(basisPoints) || basisPoints < 0) {
    throw new TypeError(`Basis points must be a non-negative integer, received ${basisPoints}`);
  }
  const scaled = amount * basisPoints;
  const sign = scaled < 0 ? -1 : 1;
  return kobo(sign * Math.floor((Math.abs(scaled) + 5_000) / 10_000));
}

export type AmountParseError =
  | "empty"
  | "not_a_number"
  | "too_many_decimals"
  | "negative"
  | "too_large";

export type AmountParseResult =
  | { ok: true; value: Kobo }
  | { ok: false; error: AmountParseError };

/**
 * Parse what a person actually types: "1,850,075.00", "1850075", "₦1 850 075.5".
 * Rejects anything ambiguous rather than guessing, because guessing at an
 * amount is how a supplier invoices for the wrong number.
 */
export function parseAmountToKobo(input: string): AmountParseResult {
  const cleaned = input.replace(/[\s,₦]/g, "").replace(/^NGN/i, "");
  if (cleaned === "") return { ok: false, error: "empty" };
  if (cleaned.startsWith("-")) return { ok: false, error: "negative" };
  if (!/^\d*(\.\d*)?$/.test(cleaned)) return { ok: false, error: "not_a_number" };

  const [whole, fraction = ""] = cleaned.split(".");
  if (fraction.length > 2) return { ok: false, error: "too_many_decimals" };
  if (whole === "" && fraction === "") return { ok: false, error: "empty" };

  const value = Number(whole || "0") * 100 + Number(fraction.padEnd(2, "0") || "0");
  if (!Number.isSafeInteger(value)) return { ok: false, error: "too_large" };
  if (value > MAX_KOBO) return { ok: false, error: "too_large" };
  return { ok: true, value: kobo(value) };
}

/** "1850075.00" -> "1,850,075.00". Never carries a currency word. */
export function formatKobo(value: Kobo): string {
  const negative = value < 0;
  const absolute = Math.abs(value);
  const whole = Math.floor(absolute / 100).toString();
  const fraction = (absolute % 100).toString().padStart(2, "0");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${negative ? "-" : ""}${grouped}.${fraction}`;
}

/** The display form used everywhere a user sees money: "NGN 1,850,075.00". */
export function formatNaira(value: Kobo): string {
  return `NGN ${formatKobo(value)}`;
}

const UNITS = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
  "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen",
  "seventeen", "eighteen", "nineteen",
];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
const SCALES: Array<[number, string]> = [
  [1_000_000_000, "billion"],
  [1_000_000, "million"],
  [1_000, "thousand"],
];

function wholeToWords(value: number): string {
  if (value < 20) return UNITS[value];
  if (value < 100) {
    const rest = value % 10;
    return TENS[Math.floor(value / 10)] + (rest ? `-${UNITS[rest]}` : "");
  }
  if (value < 1_000) {
    const rest = value % 100;
    return `${UNITS[Math.floor(value / 100)]} hundred${rest ? ` and ${wholeToWords(rest)}` : ""}`;
  }
  for (const [scale, name] of SCALES) {
    if (value >= scale) {
      const rest = value % scale;
      return `${wholeToWords(Math.floor(value / scale))} ${name}${rest ? ` ${wholeToWords(rest)}` : ""}`;
    }
  }
  return UNITS[0];
}

/**
 * Screen-reader label for the stamp card, so the amount is announced as an
 * amount rather than spelled out digit by digit (Phase 14.7).
 */
export function koboToWords(value: Kobo): string {
  const naira = Math.floor(Math.abs(value) / 100);
  const remainder = Math.abs(value) % 100;
  const nairaWords = `${wholeToWords(naira)} naira`;
  return remainder ? `${nairaWords} and ${wholeToWords(remainder)} kobo` : nairaWords;
}
