import { randomBytes, randomUUID } from "node:crypto";

/**
 * Prefixed identifiers. A support engineer reading a log line should know what
 * kind of object they are looking at without a lookup.
 */
export type IdPrefix =
  | "org"
  | "usr"
  | "sup"
  | "lnk"
  | "inv"
  | "ivl"
  | "tx"
  | "aud"
  | "flg"
  | "evt"
  | "otp"
  | "ses"
  | "invt"
  | "ntf"
  | "mlk";

export function newId(prefix: IdPrefix): string {
  return `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 20)}`;
}

/**
 * Invite codes are read aloud down a phone line and typed by hand, so the
 * alphabet excludes every pair that gets confused in speech or in a cheap
 * screen font: I/1, O/0, S/5, Z/2.
 */
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRTUVWXY3456789";

export function inviteCode(orgSlug: string): string {
  const bytes = randomBytes(4);
  let suffix = "";
  for (const byte of bytes) suffix += CODE_ALPHABET[byte % CODE_ALPHABET.length];
  return `${orgSlug}-${suffix}`;
}

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}
