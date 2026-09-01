/**
 * Phone + OTP (tickets A-02, A-03).
 *
 * Two fields stand between a suspicious supplier and their first invoice, and
 * this is both of them. Everything here is shaped by that: codes expire, a
 * replayed code is dead on arrival, and a wrong code says what to do next
 * instead of scolding.
 */
import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import { and, desc, eq, gt, isNull, sql } from "drizzle-orm";
import type { Db } from "../db/client";
import { env } from "../env";
import { otpChallenges } from "../db/schema";
import { newId } from "../ids";
import type { E164 } from "../phone";

export const CODE_LENGTH = 6;
export const CODE_TTL_MS = 10 * 60 * 1000;
export const MAX_VERIFY_ATTEMPTS = 5;
/** Issues allowed per phone inside the window, before we make them wait. */
export const MAX_ISSUES_PER_WINDOW = 3;
export const ISSUE_WINDOW_MS = 15 * 60 * 1000;
export const RESEND_AFTER_MS = 30 * 1000;
export const VOICE_AFTER_MS = 60 * 1000;

/**
 * The default is unreachable in production: env.ts marks OTP_PEPPER required
 * there and refuses to boot without it. Locally it keeps the suite from
 * needing a secret to run, and the name is what would appear in a leaked hash
 * if that guard were ever removed.
 */
function pepper(): string {
  return env().OTP_PEPPER ?? "development-pepper-not-for-production";
}

export function hashCode(phone: string, code: string): string {
  return createHash("sha256").update(`${phone}:${code}:${pepper()}`).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export type IssueResult =
  /** `code` is the plaintext, for the adapter only. It is never persisted. */
  | { ok: true; challengeId: string; expiresAt: Date; code: string }
  | { ok: false; error: "rate_limited"; retryAfterMs: number };

export type VerifyResult =
  | { ok: true; challengeId: string }
  | { ok: false; error: "no_challenge" | "expired" | "wrong_code" | "locked_out" };

export type OtpChannel = "sms" | "voice" | "whatsapp";

/**
 * Issue a code. The plaintext is returned once, to be handed straight to the
 * SMS adapter, and is never persisted — only a peppered hash reaches the
 * database.
 */
export async function issueOtp(
  db: Db,
  phone: E164,
  channel: OtpChannel = "sms",
  now: Date = new Date(),
): Promise<IssueResult> {
  const windowStart = new Date(now.getTime() - ISSUE_WINDOW_MS);
  const [recent] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(otpChallenges)
    .where(and(eq(otpChallenges.phone, phone), gt(otpChallenges.createdAt, windowStart)));

  if ((recent?.count ?? 0) >= MAX_ISSUES_PER_WINDOW) {
    return { ok: false, error: "rate_limited", retryAfterMs: ISSUE_WINDOW_MS };
  }

  const code = String(randomInt(0, 10 ** CODE_LENGTH)).padStart(CODE_LENGTH, "0");
  const challengeId = newId("otp");
  const expiresAt = new Date(now.getTime() + CODE_TTL_MS);

  await db.insert(otpChallenges).values({
    id: challengeId,
    phone,
    codeHash: hashCode(phone, code),
    channel,
    expiresAt,
    createdAt: now,
  });

  return { ok: true, challengeId, expiresAt, code };
}

/**
 * Verify and consume. A consumed challenge cannot be replayed, which is the
 * trust test for a stolen code in the Phase 18 suite.
 */
export async function verifyOtp(
  db: Db,
  phone: E164,
  code: string,
  now: Date = new Date(),
): Promise<VerifyResult> {
  const [challenge] = await db
    .select()
    .from(otpChallenges)
    .where(and(eq(otpChallenges.phone, phone), isNull(otpChallenges.consumedAt)))
    .orderBy(desc(otpChallenges.createdAt))
    .limit(1);

  if (!challenge) return { ok: false, error: "no_challenge" };
  if (challenge.expiresAt.getTime() <= now.getTime()) return { ok: false, error: "expired" };
  if (challenge.attempts >= MAX_VERIFY_ATTEMPTS) return { ok: false, error: "locked_out" };

  const submitted = code.replace(/\D/g, "");
  if (!safeEqual(hashCode(phone, submitted), challenge.codeHash)) {
    await db
      .update(otpChallenges)
      .set({ attempts: challenge.attempts + 1 })
      .where(eq(otpChallenges.id, challenge.id));
    // The final wrong attempt locks the challenge rather than inviting a sixth.
    return challenge.attempts + 1 >= MAX_VERIFY_ATTEMPTS
      ? { ok: false, error: "locked_out" }
      : { ok: false, error: "wrong_code" };
  }

  await db
    .update(otpChallenges)
    .set({ consumedAt: now })
    .where(eq(otpChallenges.id, challenge.id));

  return { ok: true, challengeId: challenge.id };
}
