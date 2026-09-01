/**
 * Sessions (ticket A-05). Signed, HTTP-only cookies; only a hash of the token
 * is stored, so a database read does not yield a usable session.
 */
import "server-only";
import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { and, eq, gt, isNull } from "drizzle-orm";
import { getDb } from "../db/client";
import { sessions } from "../db/schema";
import { newId, randomToken } from "../ids";
import { isDemo } from "../env";
import type { Principal } from "./policy";

export const SUPPLIER_COOKIE = "stampa_s";
export const BUYER_COOKIE = "stampa_c";
export const OPERATOR_COOKIE = "stampa_ops";

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export type SubjectType = "supplier" | "buyer" | "operator";

const COOKIE_FOR: Record<SubjectType, string> = {
  supplier: SUPPLIER_COOKIE,
  buyer: BUYER_COOKIE,
  operator: OPERATOR_COOKIE,
};

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function startSession(subjectType: SubjectType, subjectId: string): Promise<void> {
  const db = await getDb();
  const token = randomToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await db.insert(sessions).values({
    id: newId("ses"),
    subjectType,
    subjectId,
    tokenHash: hashToken(token),
    expiresAt,
  });

  const store = await cookies();
  store.set(COOKIE_FOR[subjectType], token, {
    httpOnly: true,
    sameSite: isDemo() && process.env.NODE_ENV === "production" ? "none" : "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

async function readSubject(subjectType: SubjectType): Promise<string | null> {
  const store = await cookies();
  const token = store.get(COOKIE_FOR[subjectType])?.value;
  if (!token) return null;

  const db = await getDb();
  const [session] = await db
    .select()
    .from(sessions)
    .where(
      and(
        eq(sessions.tokenHash, hashToken(token)),
        eq(sessions.subjectType, subjectType),
        isNull(sessions.revokedAt),
        gt(sessions.expiresAt, new Date()),
      ),
    )
    .limit(1);

  return session?.subjectId ?? null;
}

export async function endSession(subjectType: SubjectType): Promise<void> {
  const store = await cookies();
  const token = store.get(COOKIE_FOR[subjectType])?.value;
  if (token) {
    const db = await getDb();
    await db
      .update(sessions)
      .set({ revokedAt: new Date() })
      .where(eq(sessions.tokenHash, hashToken(token)));
  }
  store.delete(COOKIE_FOR[subjectType]);
}

/**
 * The principal for the current request. Everything that mutates state takes
 * this and passes it to `authorise`.
 */
export async function currentPrincipal(): Promise<Principal> {
  const supplierId = await readSubject("supplier");
  if (supplierId) return { role: "supplier_owner", supplierId };

  const operatorId = await readSubject("operator");
  if (operatorId) return { role: "operator", operatorId };

  const buyerUserId = await readSubject("buyer");
  if (buyerUserId) {
    const db = await getDb();
    const user = await db.query.buyerUsers.findFirst({
      where: (users, { eq: equals }) => equals(users.id, buyerUserId),
    });
    if (user) {
      return {
        role: user.role === "buyer_member" ? "buyer_member" : "buyer_admin",
        userId: user.id,
        organisationId: user.organisationId,
      };
    }
  }

  return { role: "anonymous" };
}
