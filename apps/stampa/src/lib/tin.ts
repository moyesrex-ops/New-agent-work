/**
 * Nigerian Taxpayer Identification Numbers (tickets B-02, O-04).
 *
 * Canonical form is eight digits, a hyphen, then a four-digit branch suffix:
 * 20481166-0001.
 *
 * The recovery logic below exists because of one specific, unavoidable fact:
 * a buyer's vendor master arrives as a spreadsheet, and a spreadsheet stores
 * "01234567-0001" as the number 12345670001. Rejecting those rows would tell a
 * Financial Controller their own data is wrong, which is both true and useless.
 */

export type Tin = string & { readonly __brand: "tin" };

const CANONICAL = /^(\d{8})-(\d{4})$/;

export type TinParseError = "empty" | "not_numeric" | "wrong_length";

export type TinParseResult =
  | { ok: true; value: Tin; recovered: boolean }
  | { ok: false; error: TinParseError };

/**
 * `recovered: true` means we reshaped the input and the buyer should be shown
 * what we did. Silent correction of a tax identifier is not acceptable.
 */
export function parseTin(input: string): TinParseResult {
  const trimmed = (input ?? "").trim();
  if (!trimmed) return { ok: false, error: "empty" };

  const canonical = trimmed.match(CANONICAL);
  if (canonical) return { ok: true, value: trimmed as Tin, recovered: false };

  if (/[^\d\s-]/.test(trimmed)) return { ok: false, error: "not_numeric" };

  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return { ok: false, error: "not_numeric" };
  if (digits.length > 12) return { ok: false, error: "wrong_length" };

  // Eight digits with no suffix: the head office branch is 0001 by convention.
  if (digits.length === 8) {
    return { ok: true, value: `${digits}-0001` as Tin, recovered: true };
  }

  // Anything between 9 and 12 digits is a leading zero eaten by a spreadsheet.
  if (digits.length >= 9) {
    const padded = digits.padStart(12, "0");
    return {
      ok: true,
      value: `${padded.slice(0, 8)}-${padded.slice(8)}` as Tin,
      recovered: digits.length !== 12 || !trimmed.includes("-"),
    };
  }

  return { ok: false, error: "wrong_length" };
}

export function isValidTin(input: string): boolean {
  return parseTin(input).ok;
}

/** Support screens show the branch suffix but mask the body: ••••1166-0001. */
export function maskTin(value: Tin | string): string {
  const parsed = parseTin(value);
  if (!parsed.ok) return "••••";
  return `••••${parsed.value.slice(4)}`;
}
