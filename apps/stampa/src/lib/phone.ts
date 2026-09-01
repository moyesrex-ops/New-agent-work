/**
 * Nigerian phone numbers (ticket A-01).
 *
 * The number is the supplier's identity, and it arrives in every shape a
 * vendor master and a human thumb can produce: 0803..., +234803..., 234803...,
 * "0803 000 0000", and — because Excel treats it as a number — 8030000000 with
 * the leading zero eaten. All of those are the same person, and failing to
 * recognise that means a supplier cannot sign in to the account their buyer
 * already created for them.
 */

/** E.164, always stored in this form. */
export type E164 = string & { readonly __brand: "e164" };

const COUNTRY_CODE = "234";

/**
 * National significant number: 10 digits. Mobile ranges in use are 70x, 80x,
 * 81x, 90x and 91x, so the first digit is 7-9 and the second is 0 or 1.
 */
const NSN_PATTERN = /^[789][01]\d{8}$/;

export type PhoneParseError = "empty" | "not_nigerian" | "wrong_length" | "not_a_mobile";

export type PhoneParseResult =
  | { ok: true; value: E164 }
  | { ok: false; error: PhoneParseError };

function digitsOf(input: string): string {
  return input.replace(/\D/g, "");
}

/** Reduce any accepted shape to the 10-digit national significant number. */
function toNsn(input: string): string | null {
  const trimmed = input.trim();
  const digits = digitsOf(trimmed);
  if (!digits) return null;

  // Explicit international form, with or without a plus.
  if (digits.startsWith(COUNTRY_CODE) && digits.length >= 13) {
    return digits.slice(COUNTRY_CODE.length);
  }
  // A leading plus that is not +234 is somebody else's country.
  if (trimmed.startsWith("+") && !digits.startsWith(COUNTRY_CODE)) return null;

  if (digits.startsWith("0")) return digits.slice(1);
  return digits;
}

export function parsePhone(input: string): PhoneParseResult {
  if (!input || !input.trim()) return { ok: false, error: "empty" };

  const nsn = toNsn(input);
  if (nsn === null) return { ok: false, error: "not_nigerian" };
  if (nsn.length !== 10) return { ok: false, error: "wrong_length" };
  if (!NSN_PATTERN.test(nsn)) return { ok: false, error: "not_a_mobile" };

  return { ok: true, value: `+${COUNTRY_CODE}${nsn}` as E164 };
}

export function isSamePhone(a: string, b: string): boolean {
  const left = parsePhone(a);
  const right = parsePhone(b);
  return left.ok && right.ok && left.value === right.value;
}

/** Display form. Nigerians read their own number as 0803 000 0000. */
export function formatPhone(value: E164 | string): string {
  const parsed = parsePhone(value);
  if (!parsed.ok) return value;
  const nsn = parsed.value.slice(4);
  return `0${nsn.slice(0, 3)} ${nsn.slice(3, 6)} ${nsn.slice(6)}`;
}

/** Never log or display a full number in support contexts: 0803 ••• 0000. */
export function maskPhone(value: E164 | string): string {
  const parsed = parsePhone(value);
  if (!parsed.ok) return "•••";
  const nsn = parsed.value.slice(4);
  return `0${nsn.slice(0, 3)} ••• ${nsn.slice(6)}`;
}

/**
 * Termii and Meta want 234… with no plus. Empty on junk rather than a
 * guessed country, so a bad number fails at send instead of reaching Ghana.
 */
export function toMsisdn(value: E164 | string): string {
  const parsed = parsePhone(value);
  if (!parsed.ok) return digitsOf(value).replace(/^\+/, "");
  return parsed.value.slice(1);
}
