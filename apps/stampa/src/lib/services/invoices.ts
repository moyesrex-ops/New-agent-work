/**
 * Invoice creation and transmission (tickets C-05, C-06, S-04..S-08).
 *
 * This is the file where a bad network becomes either a non-event or a
 * duplicate tax record, so the idempotency handling here is the load-bearing
 * part rather than the plumbing.
 */
import { createHash } from "node:crypto";
import { and, desc, eq, isNull, lte, or, sql } from "drizzle-orm";
import { getDb, type Db } from "../db/client";
import { invoiceLines, invoices, organisations, suppliers, transmissions } from "../db/schema";
import { computeInvoiceTotals, STANDARD_VAT_BASIS_POINTS } from "../vat";
import { kobo, type Kobo } from "../money";
import { newId } from "../ids";
import { writeAudit, type Actor } from "../audit";
import { amountBucket, track } from "../analytics";
import {
  caseNumber,
  getGateway,
  GatewayError,
  toUblXml,
  type GatewayInvoice,
} from "../gateway";

export const MAX_ATTEMPTS = 6;
/** 2s, 8s, 32s, 2m, 8.5m — capped at 15 minutes, jittered. */
const BASE_BACKOFF_MS = 2_000;
const MAX_BACKOFF_MS = 15 * 60 * 1000;

export function backoffMs(attempt: number, random = Math.random): number {
  const exponential = Math.min(BASE_BACKOFF_MS * 4 ** (attempt - 1), MAX_BACKOFF_MS);
  // Full jitter. Without it, a partner outage produces a synchronised
  // thundering herd the moment it recovers.
  return Math.round(exponential * (0.5 + random() * 0.5));
}

export type NewInvoiceInput = {
  supplierId: string;
  organisationId: string;
  description: string;
  quantity: number;
  unitPriceKobo: Kobo;
  vatBasisPoints?: number;
};

/** Per-supplier sequence. INV-0032, as the copy deck shows it. */
async function nextInvoiceNumber(db: Db, supplierId: string): Promise<string> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(invoices)
    .where(eq(invoices.supplierId, supplierId));
  return `INV-${String((row?.count ?? 0) + 1).padStart(4, "0")}`;
}

export async function createInvoice(input: NewInvoiceInput, actor: Actor) {
  const db = await getDb();
  const totals = computeInvoiceTotals([
    {
      description: input.description,
      quantity: input.quantity,
      unitPrice: input.unitPriceKobo,
      vatBasisPoints: input.vatBasisPoints ?? STANDARD_VAT_BASIS_POINTS,
    },
  ]);

  const invoiceId = newId("inv");
  const invoiceNumber = await nextInvoiceNumber(db, input.supplierId);

  await db.insert(invoices).values({
    id: invoiceId,
    supplierId: input.supplierId,
    organisationId: input.organisationId,
    invoiceNumber,
    subtotalKobo: totals.subtotal,
    vatKobo: totals.vat,
    totalKobo: totals.total,
    status: "draft",
  });

  const [line] = totals.lines;
  await db.insert(invoiceLines).values({
    id: newId("ivl"),
    invoiceId,
    position: 1,
    description: input.description,
    quantity: input.quantity,
    unitPriceKobo: input.unitPriceKobo,
    vatBasisPoints: line.vatBasisPoints,
    lineSubtotalKobo: line.lineSubtotal,
    lineVatKobo: line.lineVat,
  });

  await writeAudit(db, {
    actor,
    action: "invoice.created",
    subjectType: "invoice",
    subjectId: invoiceId,
    after: { invoiceNumber, totalKobo: totals.total },
  });
  await track(db, "invoice_created", actor, { bucket: amountBucket(totals.total) });

  return { id: invoiceId, invoiceNumber, ...totals };
}

/**
 * Queue an invoice for transmission and return immediately.
 *
 * The client is told "saved" the moment this returns, which is honest: the
 * work now belongs to the server. Whether the transmission is finished by the
 * browser polling or by the retry worker, both go through the same idempotent
 * path, so closing the app mid-send loses nothing (Architecture §16.8).
 */
export async function enqueueTransmission(
  invoiceId: string,
  idempotencyKey: string,
): Promise<void> {
  const db = await getDb();
  const payload = await loadGatewayInvoice(db, invoiceId);
  const requestHash = createHash("sha256").update(toUblXml(payload)).digest("hex");

  await db
    .insert(transmissions)
    .values({
      id: newId("tx"),
      invoiceId,
      attempt: 1,
      idempotencyKey,
      requestHash,
      state: "queued",
      nextAttemptAt: new Date(),
    })
    .onConflictDoNothing({ target: transmissions.idempotencyKey });

  await db.update(invoices).set({ status: "queued" }).where(eq(invoices.id, invoiceId));
}

/**
 * Finish a queued transmission. Safe to call concurrently with the worker and
 * with itself — the idempotency key is the fence.
 */
export async function runTransmission(invoiceId: string, actor: Actor): Promise<TransmitResult | null> {
  const db = await getDb();
  const row = await db.query.transmissions.findFirst({
    where: eq(transmissions.invoiceId, invoiceId),
    orderBy: desc(transmissions.createdAt),
  });
  if (!row) return null;
  if (row.state === "stamped" || row.state === "rejected") return null;

  return transmitInvoice(invoiceId, row.idempotencyKey, actor);
}

export async function loadGatewayInvoice(db: Db, invoiceId: string): Promise<GatewayInvoice> {
  const invoice = await db.query.invoices.findFirst({
    where: eq(invoices.id, invoiceId),
    with: { lines: true, supplier: true, organisation: true },
  });
  if (!invoice) throw new Error(`Invoice ${invoiceId} not found`);

  return {
    invoiceNumber: invoice.invoiceNumber,
    issuedAt: invoice.issuedAt,
    currency: "NGN",
    supplier: {
      legalName: invoice.supplier.businessName,
      tin: invoice.supplier.tin ?? "",
      address: invoice.supplier.address,
    },
    buyer: {
      legalName: invoice.organisation.legalName,
      tin: invoice.organisation.tin,
      address: invoice.organisation.address,
    },
    lines: invoice.lines.map((line) => ({
      description: line.description,
      quantity: line.quantity,
      unitPriceKobo: kobo(line.unitPriceKobo),
      vatBasisPoints: line.vatBasisPoints,
      lineSubtotalKobo: kobo(line.lineSubtotalKobo),
      lineVatKobo: kobo(line.lineVatKobo),
    })),
    subtotalKobo: kobo(invoice.subtotalKobo),
    vatKobo: kobo(invoice.vatKobo),
    totalKobo: kobo(invoice.totalKobo),
  };
}

export type TransmitResult =
  | { state: "stamped"; irn: string; stampedAt: Date }
  | {
      state: "rejected";
      fault: "supplier" | "buyer" | "neither";
      reason: string;
      offendingValue?: string;
      caseNumber: string;
      willRetry: boolean;
    };

/**
 * Transmit, once.
 *
 * The idempotency key is client-generated and unique-indexed. A second call
 * with the same key does not reach the gateway at all: it returns whatever the
 * first call decided. That is what makes it safe for the offline outbox to
 * retry a request it never saw a response to.
 */
export async function transmitInvoice(
  invoiceId: string,
  idempotencyKey: string,
  actor: Actor,
): Promise<TransmitResult> {
  const db = await getDb();

  const existing = await db.query.transmissions.findFirst({
    where: eq(transmissions.idempotencyKey, idempotencyKey),
  });

  if (existing?.state === "stamped") {
    const invoice = await db.query.invoices.findFirst({ where: eq(invoices.id, invoiceId) });
    return { state: "stamped", irn: invoice!.irn!, stampedAt: invoice!.stampedAt! };
  }
  if (existing?.state === "rejected") {
    return rejectionFrom(existing);
  }

  const payload = await loadGatewayInvoice(db, invoiceId);
  const requestHash = createHash("sha256").update(toUblXml(payload)).digest("hex");

  const transmissionId = existing?.id ?? newId("tx");
  const attempt = existing ? existing.attempt : 1;

  if (!existing) {
    await db.insert(transmissions).values({
      id: transmissionId,
      invoiceId,
      attempt,
      idempotencyKey,
      requestHash,
      state: "sending",
    });
  } else {
    await db
      .update(transmissions)
      .set({ state: "sending", lockedAt: new Date() })
      .where(eq(transmissions.id, transmissionId));
  }

  await db.update(invoices).set({ status: "sending" }).where(eq(invoices.id, invoiceId));
  await writeAudit(db, {
    actor,
    action: "invoice.transmitted",
    subjectType: "invoice",
    subjectId: invoiceId,
    after: { attempt, idempotencyKey },
  });
  await track(db, "invoice_transmitted", actor, { attempt });

  const startedAt = Date.now();

  try {
    const stamp = await getGateway().transmit(payload, idempotencyKey);

    await db
      .update(transmissions)
      .set({
        state: "stamped",
        responseCode: "OK",
        latencyMs: Date.now() - startedAt,
        lockedAt: null,
        nextAttemptAt: null,
      })
      .where(eq(transmissions.id, transmissionId));

    await db
      .update(invoices)
      .set({
        status: "stamped",
        irn: stamp.irn,
        stampedAt: stamp.stampedAt,
        failureCode: null,
        failureFault: null,
      })
      .where(eq(invoices.id, invoiceId));

    await writeAudit(db, {
      actor: { type: "system" },
      action: "invoice.stamped",
      subjectType: "invoice",
      subjectId: invoiceId,
      after: { irn: stamp.irn },
    });
    await track(db, "supplier_invoice_irn_issued", actor, {
      bucket: amountBucket(payload.totalKobo),
      attempt,
    });

    return { state: "stamped", irn: stamp.irn, stampedAt: stamp.stampedAt };
  } catch (error) {
    if (!(error instanceof GatewayError)) throw error;

    const willRetry = error.retryable && attempt < MAX_ATTEMPTS;
    const nextAttemptAt = willRetry ? new Date(Date.now() + backoffMs(attempt)) : null;

    await db
      .update(transmissions)
      .set({
        state: willRetry ? "queued" : "rejected",
        responseCode: error.code,
        fault: error.fault,
        offendingValue: error.offendingValue ?? null,
        unmappedCode: error.unmapped,
        latencyMs: Date.now() - startedAt,
        attempt: willRetry ? attempt + 1 : attempt,
        nextAttemptAt,
        lockedAt: null,
      })
      .where(eq(transmissions.id, transmissionId));

    await db
      .update(invoices)
      // A retryable failure is not a rejection the supplier should see as
      // final. It stays queued and the S8 wait copy keeps its promise.
      .set({
        status: willRetry ? "queued" : "rejected",
        failureCode: error.code,
        failureFault: error.fault,
      })
      .where(eq(invoices.id, invoiceId));

    await writeAudit(db, {
      actor: { type: "system" },
      action: "invoice.rejected",
      subjectType: "invoice",
      subjectId: invoiceId,
      after: { code: error.code, fault: error.fault, willRetry },
    });
    await track(db, "invoice_rejected", actor, { fault: error.fault, unmapped: error.unmapped });

    return {
      state: "rejected",
      fault: error.fault,
      reason: error.reason,
      offendingValue: error.offendingValue,
      caseNumber: caseNumber(transmissionId),
      willRetry,
    };
  }
}

function rejectionFrom(row: typeof transmissions.$inferSelect): TransmitResult {
  return {
    state: "rejected",
    fault: (row.fault ?? "neither") as "supplier" | "buyer" | "neither",
    reason: row.responseCode ?? "unknown",
    offendingValue: row.offendingValue ?? undefined,
    caseNumber: caseNumber(row.id),
    willRetry: false,
  };
}

/**
 * The retry worker (ticket C-05). `FOR UPDATE SKIP LOCKED` rather than a
 * broker — the architecture review cut Redis as résumé architecture at this
 * volume, and this is the replacement it named.
 */
export async function runDueTransmissions(limit = 20): Promise<number> {
  const db = await getDb();
  const now = new Date();

  const due = await db
    .select({ id: transmissions.id, invoiceId: transmissions.invoiceId, key: transmissions.idempotencyKey })
    .from(transmissions)
    .where(
      and(
        eq(transmissions.state, "queued"),
        or(isNull(transmissions.nextAttemptAt), lte(transmissions.nextAttemptAt, now)),
      ),
    )
    .limit(limit)
    .for("update", { skipLocked: true });

  let processed = 0;
  for (const row of due) {
    await transmitInvoice(row.invoiceId, row.key, { type: "system" });
    processed += 1;
  }
  return processed;
}

export async function listInvoicesForSupplier(supplierId: string) {
  const db = await getDb();
  return db.query.invoices.findMany({
    where: eq(invoices.supplierId, supplierId),
    with: { organisation: true },
    orderBy: desc(invoices.createdAt),
    limit: 100,
  });
}

export async function getInvoiceForSupplier(invoiceId: string, supplierId: string) {
  const db = await getDb();
  return db.query.invoices.findFirst({
    where: and(eq(invoices.id, invoiceId), eq(invoices.supplierId, supplierId)),
    with: { organisation: true, supplier: true, lines: true, transmissions: true },
  });
}

export async function listInboundInvoices(organisationId: string) {
  const db = await getDb();
  return db.query.invoices.findMany({
    where: and(eq(invoices.organisationId, organisationId), eq(invoices.status, "stamped")),
    with: { supplier: true },
    orderBy: desc(invoices.stampedAt),
    limit: 500,
  });
}

export async function countStampedToday(): Promise<number> {
  const db = await getDb();
  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(invoices)
    .where(and(eq(invoices.status, "stamped"), sql`${invoices.stampedAt} >= ${since}`));
  return row?.count ?? 0;
}

export { invoices, suppliers, organisations };
