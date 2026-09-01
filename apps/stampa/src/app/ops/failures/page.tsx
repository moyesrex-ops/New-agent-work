import Link from "next/link";
import { Button } from "@/components/Button";
import { Banner, Card, DataTable, EmptyState, StatusChip } from "@/components/Surfaces";
import { requireOperator } from "@/lib/auth/require";
import { copy, formatDateTime } from "@/lib/copy";
import { formatOffendingValue } from "@/lib/gateway";
import { failureQueue } from "@/lib/services/operator";
import { MAX_ATTEMPTS } from "@/lib/services/invoices";
import { retryAll, retryOne } from "../actions";
import shell from "@/components/shell.module.css";

export const dynamic = "force-dynamic";

const FAULT_LABEL: Record<string, string> = {
  supplier: "Supplier can fix",
  buyer: "Buyer must fix",
  neither: "Neither side can fix",
};

/**
 * O2 Failure queue, grouped by error code.
 *
 * Failures arrive in batches with one cause — a buyer's TIN goes stale and
 * forty invoices bounce. Grouping is what turns forty phone calls into one,
 * and the group-level retry is what makes the fix land.
 */
export default async function Failures({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; retried?: string }>;
}) {
  await requireOperator();
  const { error, retried } = await searchParams;
  const groups = await failureQueue();

  return (
    <>
      <h1 className={shell.title}>{copy.operator.failuresHeading}</h1>

      {retried ? (
        <div style={{ marginBottom: "var(--space-5)" }}>
          <Banner tone="neutral">Retried {retried}. Anything still failing is below.</Banner>
        </div>
      ) : null}
      {error === "reason" ? (
        <div style={{ marginBottom: "var(--space-5)" }}>
          <Banner tone="danger">{copy.operator.reasonRequired}</Banner>
        </div>
      ) : null}

      {!groups.length ? (
        <EmptyState heading={copy.operator.failuresEmpty} />
      ) : (
        groups.map((group) => (
          <section key={group.code} className={shell.section}>
            <div style={{ display: "flex", alignItems: "baseline", gap: "var(--space-3)" }}>
              <h2 className={shell.sectionTitle} style={{ marginBottom: 0 }}>
                {group.code}
              </h2>
              {/* Derived from the rows, not from the fault. A group where the
                  retries are spent is not waiting on anything. */}
              <StatusChip
                status={group.fault === "neither" && !group.stopped ? "waiting" : "rejected"}
              />
              <span className={shell.note}>
                {FAULT_LABEL[group.fault] ?? group.fault} · {group.count}
              </span>
              {group.stopped ? (
                <span className={shell.note} style={{ color: "var(--color-danger-700)" }}>
                  {group.stopped} stopped
                </span>
              ) : null}
              {group.rows[0].unmappedCode ? (
                <span className={shell.note} style={{ color: "var(--color-danger-700)" }}>
                  Unmapped — add it to ERROR_MAP
                </span>
              ) : null}
            </div>
            <p className={shell.note} style={{ marginBottom: "var(--space-3)" }}>
              {group.reason}
            </p>

            <DataTable
              caption={`Transmissions failing with ${group.code}`}
              rows={group.rows}
              empty={<Card>Nothing here.</Card>}
              columns={[
                {
                  key: "invoice",
                  header: "Invoice",
                  render: (row) => row.invoiceNumber,
                },
                { key: "supplier", header: "Supplier", render: (row) => row.supplierName },
                { key: "case", header: "Case", render: (row) => row.caseNumber },
                {
                  key: "value",
                  header: "Offending value",
                  render: (row) =>
                    row.offendingValue ? formatOffendingValue(group.code, row.offendingValue) : "—",
                },
                {
                  key: "attempt",
                  header: "Attempt",
                  numeric: true,
                  render: (row) => `${row.attempt} of ${MAX_ATTEMPTS}`,
                },
                {
                  key: "next",
                  header: "Next try",
                  render: (row) =>
                    row.nextAttemptAt ? (
                      formatDateTime(row.nextAttemptAt)
                    ) : (
                      // The only rows on this page that need a person.
                      <span style={{ color: "var(--color-danger-700)" }}>Stopped</span>
                    ),
                },
                {
                  key: "when",
                  header: "First failed",
                  render: (row) => formatDateTime(row.createdAt),
                },
                {
                  key: "action",
                  header: "",
                  render: (row) => (
                    <form action={retryOne} className={shell.inlineForm}>
                      <input type="hidden" name="transmissionId" value={row.transmissionId} />
                      <input
                        name="reason"
                        placeholder="Reason"
                        aria-label={`Reason for retrying ${row.invoiceNumber}`}
                        className={shell.searchInput}
                        required
                        minLength={4}
                      />
                      <Button type="submit" variant="secondary" compact>
                        {copy.operator.retry}
                      </Button>
                    </form>
                  ),
                },
              ]}
            />

            <form action={retryAll} className={shell.inlineForm} style={{ marginTop: "var(--space-3)" }}>
              <input type="hidden" name="code" value={group.code} />
              <input
                name="reason"
                placeholder="Reason for the whole group"
                aria-label={`Reason for retrying all ${group.code}`}
                className={shell.searchInput}
                required
                minLength={4}
              />
              <Button type="submit" compact>
                {copy.operator.retryGroup(group.count)}
              </Button>
            </form>
          </section>
        ))
      )}

      <p className={shell.note}>
        Retrying reuses the original idempotency key, so a retry can never become a second tax
        record. <Link href="/ops/audit">Every retry is in the audit log.</Link>
      </p>
    </>
  );
}
