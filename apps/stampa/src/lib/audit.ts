/**
 * Audit logging (ticket C-07, Architecture §16.6).
 *
 * Every action that touches money or identity writes a row here in the same
 * transaction as the change itself. Append-only: this module exports no delete
 * and no update, and there is no other writer of the table.
 */
import { auditEvents } from "./db/schema";
import type { Db } from "./db/client";
import { newId } from "./ids";

export type Actor =
  | { type: "supplier"; id: string }
  | { type: "buyer"; id: string }
  | { type: "operator"; id: string }
  | { type: "system"; id?: string }
  | { type: "anonymous"; id?: string };

/**
 * The closed list from Architecture §16.6. A new action must be added here
 * deliberately, which is the point — it makes "we forgot to audit that" a
 * compile error rather than a discovery during an incident.
 */
export type AuditAction =
  | "supplier.created"
  | "supplier.confirmed"
  | "supplier.edited"
  | "supplier.suspended"
  | "supplier.deleted"
  | "supplier_link.bank_updated"
  | "invitation.sent"
  | "invitation.nudged"
  | "invitation.opened"
  | "invitation.bound"
  | "vendor_master.imported"
  | "invoice.created"
  | "invoice.transmitted"
  | "invoice.stamped"
  | "invoice.rejected"
  | "operator.record_viewed"
  | "operator.tin_corrected"
  | "operator.transmission_retried"
  | "operator.flag_resolved"
  | "role.changed"
  | "account.deleted";

/** Operator writes are meaningless in an audit log without a stated reason. */
const REASON_REQUIRED: ReadonlySet<AuditAction> = new Set([
  "operator.record_viewed",
  "operator.tin_corrected",
  "operator.transmission_retried",
  "operator.flag_resolved",
  "supplier.suspended",
]);

export type AuditInput = {
  actor: Actor;
  action: AuditAction;
  subjectType: string;
  subjectId: string;
  before?: unknown;
  after?: unknown;
  reason?: string;
  ip?: string;
  userAgent?: string;
};

export async function writeAudit(db: Db, input: AuditInput): Promise<void> {
  if (REASON_REQUIRED.has(input.action) && !input.reason?.trim()) {
    throw new Error(`Audit action ${input.action} requires a reason`);
  }

  await db.insert(auditEvents).values({
    id: newId("aud"),
    actorType: input.actor.type,
    actorId: input.actor.id ?? null,
    action: input.action,
    subjectType: input.subjectType,
    subjectId: input.subjectId,
    before: (input.before ?? null) as never,
    after: (input.after ?? null) as never,
    reason: input.reason ?? null,
    ip: input.ip ?? null,
    userAgent: input.userAgent ?? null,
  });
}
