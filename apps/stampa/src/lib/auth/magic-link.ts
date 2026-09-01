/**
 * Buyer sign-in (ticket A-04).
 *
 * A Financial Controller does not want another password and will not install
 * an authenticator, so the console signs in with a link to their work address.
 * Three properties matter and each is enforced here rather than in the route:
 * the address must be a work address, the token is single-use, and the reply
 * to "send me a link" is identical whether or not the account exists.
 */
import "server-only";
import { createHash } from "node:crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import type { Db } from "../db/client";
import { buyerUsers, magicLinks } from "../db/schema";
import { newId, randomToken } from "../ids";

export const LINK_TTL_MS = 20 * 60 * 1000;

/**
 * Consumer mailboxes. The console holds a company's whole vendor master, so a
 * personal address is the wrong container for it — and in practice, the person
 * who owns this problem has a work address.
 */
const CONSUMER_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.co.uk",
  "ymail.com",
  "hotmail.com",
  "outlook.com",
  "live.com",
  "aol.com",
  "icloud.com",
  "me.com",
  "protonmail.com",
  "proton.me",
  "zoho.com",
  "mail.com",
  "gmx.com",
  "yandex.com",
]);

export type ParsedEmail =
  | { ok: true; value: string; domain: string }
  | { ok: false; error: "empty" | "malformed" | "not_work_email" };

export function parseWorkEmail(input: string): ParsedEmail {
  const value = input.trim().toLowerCase();
  if (!value) return { ok: false, error: "empty" };

  // Deliberately permissive on the local part and strict on the shape. Full
  // RFC 5322 validation rejects addresses that work, which is worse.
  const match = /^[^\s@]+@([a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9-]+)+)$/.exec(value);
  if (!match) return { ok: false, error: "malformed" };

  const domain = match[1];
  if (CONSUMER_DOMAINS.has(domain)) return { ok: false, error: "not_work_email" };

  return { ok: true, value, domain };
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export type IssuedLink = { token: string; expiresAt: Date } | null;

/**
 * Issue a link if — and only if — the address belongs to a provisioned buyer
 * user. Returns null otherwise, and the caller shows the same confirmation
 * either way, so the form cannot be used to discover who our customers are.
 */
export async function issueMagicLink(
  db: Db,
  email: string,
  now: Date = new Date(),
): Promise<IssuedLink> {
  const user = await db.query.buyerUsers.findFirst({ where: eq(buyerUsers.email, email) });
  if (!user) return null;
  return createMagicLink(db, email, now);
}

export async function createMagicLink(
  db: Db,
  email: string,
  now: Date = new Date(),
): Promise<{ token: string; expiresAt: Date }> {
  const token = randomToken();
  const expiresAt = new Date(now.getTime() + LINK_TTL_MS);

  await db.insert(magicLinks).values({
    id: newId("mlk"),
    email,
    tokenHash: hashToken(token),
    expiresAt,
    createdAt: now,
  });

  return { token, expiresAt };
}

export type LinkFailure = "invalid" | "expired" | "used";

/** Single use. A link forwarded on to a colleague is dead, which is the point. */
export async function redeemMagicLink(
  db: Db,
  token: string,
  now: Date = new Date(),
): Promise<{ ok: true; email: string } | { ok: false; error: LinkFailure }> {
  const link = await db.query.magicLinks.findFirst({
    where: eq(magicLinks.tokenHash, hashToken(token)),
  });
  if (!link) return { ok: false, error: "invalid" };
  if (link.consumedAt) return { ok: false, error: "used" };
  if (link.expiresAt.getTime() <= now.getTime()) return { ok: false, error: "expired" };

  // Conditional update: two tabs opening the same link race here, and exactly
  // one of them wins.
  const claimed = await db
    .update(magicLinks)
    .set({ consumedAt: now })
    .where(
      and(eq(magicLinks.id, link.id), isNull(magicLinks.consumedAt), gt(magicLinks.expiresAt, now)),
    )
    .returning();
  if (!claimed.length) return { ok: false, error: "used" };

  return { ok: true, email: link.email };
}

export type ConsumeResult =
  | { ok: true; userId: string; organisationId: string }
  | { ok: false; error: LinkFailure };

export async function consumeMagicLink(
  db: Db,
  token: string,
  now: Date = new Date(),
): Promise<ConsumeResult> {
  const redeemed = await redeemMagicLink(db, token, now);
  if (!redeemed.ok) return redeemed;

  const user = await db.query.buyerUsers.findFirst({
    where: eq(buyerUsers.email, redeemed.email),
  });
  if (!user) return { ok: false, error: "invalid" };

  return { ok: true, userId: user.id, organisationId: user.organisationId };
}
