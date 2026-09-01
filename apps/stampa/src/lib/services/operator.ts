/**
 * Operator console services (tickets O-01..O-06).
 *
 * This is the console that makes the first 1,000 users runnable, and its
 * defining constraint is that an operator can read anything and change almost
 * nothing. Every write in this file is one of the four corrective actions from
 * the policy module, each audited with a reason the operator had to type.
 */
import { and, desc, eq, gte, ilike, isNotNull, or, sql } from "drizzle-orm";
import { getDb } from "../db/client";
import {
  analyticsEvents,
  auditEvents,
  flags,
  invoices,
  supplierLinks,
  suppliers,
  transmissions,
} from "../db/schema";
import { NORTH_STAR } from "../analytics";
import { writeAudit } from "../audit";
import { newId } from "../ids";
import { formatPhone, parsePhone } from "../phone";
import { maskTin, parseTin } from "../tin";
import { caseNumber, describeCode } from "../gateway";
import { transmitInvoice } from "./invoices";

export type Metrics = {
  stampedToday: number;
  stampedThisWeek: number;
  suppliersLive: number;
  suppliersStuck: number;
  queued: number;
  failing: number;
};

function startOfDay(now: Date): Date {
  const start = new Date(now);
  start.setUTCHours(0, 0, 0, 0);
  return start;
}

/** O1. One question: is the north star moving today. */
export async function metrics(now: Date = new Date()): Promise<Metrics> {
  const db = await getDb();
  const today = startOfDay(now);
  const weekAgo = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000);

  const northStarSince = async (since: Date) => {
    const [row] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(analyticsEvents)
      .where(and(eq(analyticsEvents.name, NORTH_STAR), gte(analyticsEvents.createdAt, since)));
    return row?.n ?? 0;
  };

  const linksWithStatus = async (status: string) => {
    const [row] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(supplierLinks)
      .where(eq(supplierLinks.status, status));
    return row?.n ?? 0;
  };

  const invoicesWithStatus = async (status: string) => {
    const [row] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(invoices)
      .where(eq(invoices.status, status));
    return row?.n ?? 0;
  };

  return {
    stampedToday: await northStarSince(today),
    stampedThisWeek: await northStarSince(weekAgo),
    suppliersLive: await linksWithStatus("live"),
    suppliersStuck: await linksWithStatus("opened"),
    queued: await invoicesWithStatus("queued"),
    failing: await invoicesWithStatus("rejected"),
  };
}

export type FailureRow = {
  transmissionId: string;
  invoiceId: string;
  invoiceNumber: string;
  supplierName: string;
  caseNumber: string;
  attempt: number;
  /**
   * When the system will try again on its own, or null once the attempts are
   * spent. This is the whole triage question: a queue that shows a row at
   * attempt 6 with the same "waiting" chip as a row at attempt 2 is telling an
   * operator to leave alone the one row that needs them.
   */
  nextAttemptAt: Date | null;
  offendingValue: string | null;
  unmappedCode: boolean;
  createdAt: Date;
};

export type FailureGroup = {
  code: string;
  reason: string;
  fault: string;
  count: number;
  /** Rows nothing further will happen to without a human. */
  stopped: number;
  rows: FailureRow[];
};

/**
 * O2. Grouped by error code, because failures arrive in batches with a single
 * cause. An operator who fixes one buyer's TIN wants to retry the forty
 * invoices that failed on it, not scroll a list.
 */
export async function failureQueue(): Promise<FailureGroup[]> {
  const db = await getDb();
  const rows = await db.query.transmissions.findMany({
    where: or(eq(transmissions.state, "rejected"), isNotNull(transmissions.fault)),
    with: { invoice: { with: { supplier: true } } },
    orderBy: desc(transmissions.createdAt),
    limit: 500,
  });

  const groups = new Map<string, FailureGroup>();

  for (const row of rows) {
    if (row.state === "stamped") continue;
    const code = row.responseCode ?? "UNKNOWN";
    const group = groups.get(code) ?? {
      code,
      reason: describeCode(code),
      fault: row.fault ?? "neither",
      count: 0,
      stopped: 0,
      rows: [],
    };

    group.count += 1;
    if (!row.nextAttemptAt) group.stopped += 1;
    group.rows.push({
      transmissionId: row.id,
      invoiceId: row.invoiceId,
      invoiceNumber: row.invoice.invoiceNumber,
      supplierName: row.invoice.supplier.businessName,
      caseNumber: caseNumber(row.id),
      attempt: row.attempt,
      nextAttemptAt: row.nextAttemptAt,
      offendingValue: row.offendingValue,
      unmappedCode: row.unmappedCode,
      createdAt: row.createdAt,
    });
    groups.set(code, group);
  }

  // Unmapped codes first: those are the ones nobody has looked at yet. Then
  // groups holding rows the system has given up on, because those are waiting
  // on a person and everything else is waiting on a clock.
  for (const group of groups.values()) {
    group.rows.sort((a, b) => Number(Boolean(a.nextAttemptAt)) - Number(Boolean(b.nextAttemptAt)));
  }

  return [...groups.values()].sort((a, b) => {
    const unmapped = Number(b.rows[0].unmappedCode) - Number(a.rows[0].unmappedCode);
    if (unmapped !== 0) return unmapped;
    const stopped = b.stopped - a.stopped;
    return stopped !== 0 ? stopped : b.count - a.count;
  });
}

export async function retryTransmission(
  transmissionId: string,
  operatorId: string,
  reason: string,
): Promise<void> {
  const db = await getDb();
  const row = await db.query.transmissions.findFirst({
    where: eq(transmissions.id, transmissionId),
  });
  if (!row) throw new Error("Transmission not found");

  await writeAudit(db, {
    actor: { type: "operator", id: operatorId },
    action: "operator.transmission_retried",
    subjectType: "invoice",
    subjectId: row.invoiceId,
    reason,
    after: { transmissionId, previousCode: row.responseCode },
  });

  // Reopen the row rather than creating a second one: the idempotency key is
  // the fence that stops a retry becoming a duplicate tax record.
  await db
    .update(transmissions)
    .set({ state: "queued", nextAttemptAt: new Date(), attempt: row.attempt + 1 })
    .where(eq(transmissions.id, transmissionId));

  await transmitInvoice(row.invoiceId, row.idempotencyKey, {
    type: "operator",
    id: operatorId,
  });
}

export async function retryGroup(code: string, operatorId: string, reason: string): Promise<number> {
  const groups = await failureQueue();
  const group = groups.find((candidate) => candidate.code === code);
  if (!group) return 0;

  for (const row of group.rows) {
    await retryTransmission(row.transmissionId, operatorId, reason);
  }
  return group.rows.length;
}

export type LookupHit =
  | { kind: "supplier"; id: string; title: string; detail: string }
  | { kind: "invoice"; id: string; title: string; detail: string };

/**
 * O3. One box. A support call gives you whatever the caller happens to have —
 * a phone number, an invoice number, an IRN, half a TIN — and asking them to
 * pick a category first is thirty seconds nobody has.
 */
export async function lookup(term: string): Promise<LookupHit[]> {
  const query = term.trim();
  if (query.length < 3) return [];

  const db = await getDb();
  const hits: LookupHit[] = [];

  const phone = parsePhone(query);
  const tin = parseTin(query);
  const like = `%${query}%`;

  const supplierRows = await db.query.suppliers.findMany({
    where: or(
      phone.ok ? eq(suppliers.phone, phone.value) : undefined,
      tin.ok ? eq(suppliers.tin, tin.value) : undefined,
      ilike(suppliers.businessName, like),
      ilike(suppliers.phone, like),
    ),
    limit: 20,
  });

  for (const row of supplierRows) {
    // Searching is unaudited, so a result carries only enough to pick the
    // right row: the name and the number the caller just read out. The tax
    // identifier is masked until a reason has been written to the audit log,
    // which is what opening the record does.
    const tinPart = row.tin ? ` · ${maskTin(row.tin)}` : " · no TIN";
    hits.push({
      kind: "supplier",
      id: row.id,
      title: row.businessName,
      detail: `${formatPhone(row.phone)}${tinPart}${row.deletedAt ? " · deleted" : ""}`,
    });
  }

  const invoiceRows = await db.query.invoices.findMany({
    where: or(ilike(invoices.invoiceNumber, like), ilike(invoices.irn, like)),
    with: { supplier: true },
    limit: 20,
  });

  for (const row of invoiceRows) {
    hits.push({
      kind: "invoice",
      id: row.id,
      title: `${row.invoiceNumber} · ${row.supplier.businessName}`,
      detail: `${row.status}${row.irn ? ` · ${row.irn}` : ""}`,
    });
  }

  return hits;
}

/**
 * O4. Reading a supplier's record is itself an audited event with a required
 * reason. Support access to a stranger's tax records is exactly the kind of
 * thing that should leave a trail.
 */
export async function openSupplierRecord(supplierId: string, operatorId: string, reason: string) {
  const db = await getDb();

  await writeAudit(db, {
    actor: { type: "operator", id: operatorId },
    action: "operator.record_viewed",
    subjectType: "supplier",
    subjectId: supplierId,
    reason,
  });

  const supplier = await db.query.suppliers.findFirst({
    where: eq(suppliers.id, supplierId),
    with: { links: { with: { organisation: true } } },
  });
  if (!supplier) return null;

  const rows = await db.query.invoices.findMany({
    where: eq(invoices.supplierId, supplierId),
    with: { organisation: true, transmissions: true },
    orderBy: desc(invoices.createdAt),
    limit: 50,
  });

  const trail = await db.query.auditEvents.findMany({
    where: and(eq(auditEvents.subjectType, "supplier"), eq(auditEvents.subjectId, supplierId)),
    orderBy: desc(auditEvents.createdAt),
    limit: 50,
  });

  return { supplier, invoices: rows, trail };
}

/** O4. The one field correction support is allowed to make. */
export async function correctTin(
  supplierId: string,
  rawTin: string,
  operatorId: string,
  reason: string,
): Promise<{ ok: true } | { ok: false; problem: string }> {
  const parsed = parseTin(rawTin);
  if (!parsed.ok) return { ok: false, problem: "That is not a valid TIN." };

  const db = await getDb();
  const before = await db.query.suppliers.findFirst({ where: eq(suppliers.id, supplierId) });
  if (!before) return { ok: false, problem: "No such supplier." };

  await writeAudit(db, {
    actor: { type: "operator", id: operatorId },
    action: "operator.tin_corrected",
    subjectType: "supplier",
    subjectId: supplierId,
    reason,
    before: { tin: before.tin },
    after: { tin: parsed.value },
  });

  await db.update(suppliers).set({ tin: parsed.value }).where(eq(suppliers.id, supplierId));
  return { ok: true };
}

export async function listFlags(state = "open") {
  const db = await getDb();
  return db.query.flags.findMany({
    where: eq(flags.state, state),
    orderBy: desc(flags.createdAt),
    limit: 200,
  });
}

export async function raiseFlag(input: {
  subjectType: string;
  subjectId: string;
  reason: string;
  raisedBy: string;
}): Promise<string> {
  const db = await getDb();
  const id = newId("flg");
  await db.insert(flags).values({ id, ...input });
  return id;
}

/** O5. Suspending a supplier stops transmission; it never deletes anything. */
export async function resolveFlag(
  flagId: string,
  resolution: "suspend" | "dismiss",
  operatorId: string,
  reason: string,
): Promise<void> {
  const db = await getDb();
  const flag = await db.query.flags.findFirst({ where: eq(flags.id, flagId) });
  if (!flag) throw new Error("Flag not found");

  await writeAudit(db, {
    actor: { type: "operator", id: operatorId },
    action: "operator.flag_resolved",
    subjectType: flag.subjectType,
    subjectId: flag.subjectId,
    reason,
    after: { resolution },
  });

  if (resolution === "suspend" && flag.subjectType === "supplier") {
    await writeAudit(db, {
      actor: { type: "operator", id: operatorId },
      action: "supplier.suspended",
      subjectType: "supplier",
      subjectId: flag.subjectId,
      reason,
    });
    await db
      .update(suppliers)
      .set({ suspendedAt: new Date() })
      .where(eq(suppliers.id, flag.subjectId));
  }

  await db
    .update(flags)
    .set({ state: resolution === "suspend" ? "upheld" : "dismissed", resolvedAt: new Date(), resolutionNote: reason })
    .where(eq(flags.id, flagId));
}

/** O6. Append-only, read in reverse. */
export async function auditTrail(limit = 200) {
  const db = await getDb();
  return db.query.auditEvents.findMany({ orderBy: desc(auditEvents.createdAt), limit });
}
