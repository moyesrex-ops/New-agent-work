/**
 * Analytics (Architecture §16.10). Rows in Postgres, not a third-party SDK —
 * cheaper, resident, and it cannot leak what it never sends anywhere.
 *
 * The event list is closed and the property guard is enforced at runtime,
 * because "no PII in analytics" is a promise that decays the moment it is only
 * a convention.
 */
import { analyticsEvents } from "./db/schema";
import type { Db } from "./db/client";
import type { Actor } from "./audit";
import { newId } from "./ids";

export type AnalyticsEventName =
  | "invite_opened"
  | "supplier_verified"
  | "supplier_confirmed_details"
  | "invoice_created"
  | "invoice_transmitted"
  /** North star. The only event that means value existed. */
  | "supplier_invoice_irn_issued"
  | "invoice_rejected"
  | "stamp_shared"
  | "supplier_added_second_buyer"
  | "buyer_exposure_computed"
  | "buyer_invites_sent"
  | "buyer_export_downloaded";

export const NORTH_STAR: AnalyticsEventName = "supplier_invoice_irn_issued";

export type AnalyticsProperties = Record<string, string | number | boolean | null>;

/**
 * Property keys that must never appear. Amounts are recorded as buckets and
 * invoice descriptions are commercially sensitive, so neither is permitted
 * even by accident.
 */
const BANNED_KEYS = [
  "phone",
  "msisdn",
  "tin",
  "description",
  "amount",
  "total",
  "email",
  "name",
  "address",
  "bank",
  "irn",
];

const PHONE_SHAPE = /(\+?234\d{9,10}|\b0[789][01]\d{8}\b)/;
const TIN_SHAPE = /\b\d{8}-\d{4}\b/;

export function assertNoPii(properties: AnalyticsProperties): void {
  for (const [key, value] of Object.entries(properties)) {
    const lower = key.toLowerCase();
    if (BANNED_KEYS.some((banned) => lower.includes(banned))) {
      throw new Error(`Analytics property "${key}" looks like PII and is not allowed`);
    }
    if (typeof value === "string" && (PHONE_SHAPE.test(value) || TIN_SHAPE.test(value))) {
      throw new Error(`Analytics property "${key}" contains a phone number or TIN`);
    }
  }
}

/**
 * Amounts are bucketed rather than recorded, so we can see the shape of the
 * business without holding a record of what any supplier charged.
 */
export function amountBucket(totalKobo: number): string {
  const naira = totalKobo / 100;
  if (naira < 50_000) return "under_50k";
  if (naira < 250_000) return "50k_250k";
  if (naira < 1_000_000) return "250k_1m";
  if (naira < 5_000_000) return "1m_5m";
  return "over_5m";
}

export async function track(
  db: Db,
  name: AnalyticsEventName,
  actor: Actor,
  properties: AnalyticsProperties = {},
): Promise<void> {
  assertNoPii(properties);
  await db.insert(analyticsEvents).values({
    id: newId("evt"),
    name,
    actorType: actor.type,
    actorId: actor.id ?? null,
    properties: properties as never,
  });
}
