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
 * Keys that name an identifier. Banned for string values only: a boolean
 * derived from one, such as `phoneMismatch: true`, cannot carry the number
 * itself, and forbidding it would push useful funnel signal out of the system
 * for no privacy gain.
 */
const IDENTIFIER_KEYS = [
  "phone",
  "msisdn",
  "tin",
  "description",
  "email",
  "name",
  "address",
  "bank",
  "irn",
];

/**
 * Keys that name money. Banned for numeric values, because amounts are
 * recorded as buckets (Architecture §16.10) and a raw figure here would make
 * the analytics table a record of what every supplier charges.
 */
const MONETARY_KEYS = ["amount", "total", "subtotal", "vat", "price", "spend", "kobo", "naira"];

const PHONE_SHAPE = /(\+?234\d{9,10}|\b0[789][01]\d{8}\b)/;
const TIN_SHAPE = /\b\d{8}-\d{4}\b/;

export function assertNoPii(properties: AnalyticsProperties): void {
  for (const [key, value] of Object.entries(properties)) {
    const lower = key.toLowerCase();

    if (typeof value === "string") {
      if (IDENTIFIER_KEYS.some((banned) => lower.includes(banned))) {
        throw new Error(`Analytics property "${key}" looks like PII and is not allowed`);
      }
      if (PHONE_SHAPE.test(value) || TIN_SHAPE.test(value)) {
        throw new Error(`Analytics property "${key}" contains a phone number or TIN`);
      }
    }

    if (typeof value === "number" && MONETARY_KEYS.some((banned) => lower.includes(banned))) {
      throw new Error(`Analytics property "${key}" looks like an amount. Use amountBucket()`);
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
