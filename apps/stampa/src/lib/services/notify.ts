/**
 * Notifications (tickets N-03, N-04).
 *
 * Two rules, both from Flow 6, both enforced here rather than by convention:
 *
 *   1. Every message deep-links to the exact screen that resolves it. No
 *      notification ever says "you have an update".
 *   2. A message is written to `notifications` before it is judged delivered,
 *      and the unique index on (template, subject) means the same event cannot
 *      announce itself twice however many times a worker retries.
 */
import { and, eq, isNull, lt } from "drizzle-orm";
import { getDb } from "../db/client";
import { invitations, notifications } from "../db/schema";
import { newId } from "../ids";
import { copy } from "../copy";
import { env } from "../env";
import { formatKobo, kobo } from "../money";
import { sendWithFallback } from "../messaging";
import type { TransmitResult } from "./invoices";

/** Absolute, because a deep link inside a WhatsApp message cannot be relative. */
export function appUrl(path: string): string {
  const base = env().APP_URL ?? "http://localhost:3000";
  return `${base.replace(/\/$/, "")}${path}`;
}

type Attempt = { template: string; subjectType: string; subjectId: string; to: string; body: string; link: string };

/**
 * Claim the right to send, then send. Claiming first means a crash between the
 * two under-notifies, which is recoverable, rather than over-notifying, which
 * is not.
 */
async function sendOnce(attempt: Attempt): Promise<boolean> {
  const db = await getDb();
  const claimed = await db
    .insert(notifications)
    .values({
      id: newId("ntf"),
      subjectType: attempt.subjectType,
      subjectId: attempt.subjectId,
      template: attempt.template,
      state: "sending",
    })
    .onConflictDoNothing({
      target: [notifications.template, notifications.subjectType, notifications.subjectId],
    })
    .returning();

  const row = claimed.at(0);
  if (!row) return false;

  const result = await sendWithFallback({
    to: attempt.to,
    template: attempt.template,
    body: attempt.body,
    link: attempt.link,
  });

  await db
    .update(notifications)
    .set(
      result.ok
        ? { state: "sent", channel: result.channel }
        : { state: "failed", channel: result.channel, problem: result.problem },
    )
    .where(eq(notifications.id, row.id));

  return result.ok;
}

export type InvoiceNotice = {
  invoiceId: string;
  invoiceNumber: string;
  supplierPhone: string;
  buyerName: string;
  totalKobo: number;
};

/** Called after every terminal transmission outcome. */
export async function notifyTransmissionOutcome(
  notice: InvoiceNotice,
  result: TransmitResult,
): Promise<void> {
  const link = appUrl(`/s/invoice/${notice.invoiceId}`);

  if (result.state === "stamped") {
    await sendOnce({
      template: "invoice_stamped",
      subjectType: "invoice",
      subjectId: notice.invoiceId,
      to: notice.supplierPhone,
      body: copy.notify.stamped({
        number: notice.invoiceNumber,
        buyer: notice.buyerName,
        amount: formatKobo(kobo(notice.totalKobo)),
        irn: result.irn,
      }),
      link,
    });
    return;
  }

  // A failure that will be retried is not news. Telling a supplier their
  // invoice failed and then that it succeeded thirty seconds later teaches
  // them to distrust the messages that matter.
  if (result.willRetry) return;

  const body =
    result.fault === "supplier"
      ? copy.notify.rejectedSupplier({ number: notice.invoiceNumber, reason: result.reason })
      : result.fault === "buyer"
        ? copy.notify.rejectedBuyer({ number: notice.invoiceNumber, buyer: notice.buyerName })
        : copy.notify.rejectedNeither({
            number: notice.invoiceNumber,
            caseNumber: result.caseNumber,
          });

  await sendOnce({
    template: `invoice_rejected_${result.fault}`,
    subjectType: "invoice",
    subjectId: notice.invoiceId,
    to: notice.supplierPhone,
    body,
    link,
  });
}

const NUDGE_AFTER_MS = 3 * 24 * 60 * 60 * 1000;

/**
 * Day-3 nudge to suppliers who opened the invite and did not finish (N-04).
 *
 * "Opened but did not finish" is the only cohort worth chasing: they already
 * cleared the suspicion hurdle, so what stopped them was friction rather than
 * distrust, and friction is worth one reminder. Never invited-but-never-opened
 * — that is the buyer's conversation, not ours.
 */
export async function sendDueNudges(now: Date = new Date()): Promise<number> {
  const db = await getDb();
  const cutoff = new Date(now.getTime() - NUDGE_AFTER_MS);

  const stale = await db.query.invitations.findMany({
    where: and(isNull(invitations.boundAt), lt(invitations.openedAt, cutoff)),
    with: { supplierLink: { with: { supplier: true, organisation: true } } },
    limit: 200,
  });

  let sent = 0;
  for (const invitation of stale) {
    const link = invitation.supplierLink;
    if (link.status === "live") continue;

    const delivered = await sendOnce({
      template: "invite_nudge",
      subjectType: "invitation",
      subjectId: invitation.id,
      to: link.supplier.phone,
      body: copy.notify.nudge(link.organisation.legalName),
      link: appUrl(`/s/i/${invitation.code}`),
    });
    if (delivered) sent += 1;
  }
  return sent;
}

/** Support answer to "did they get the message?", used by the operator console. */
export async function notificationsFor(subjectType: string, subjectId: string) {
  const db = await getDb();
  return db.query.notifications.findMany({
    where: and(
      eq(notifications.subjectType, subjectType),
      eq(notifications.subjectId, subjectId),
    ),
  });
}
