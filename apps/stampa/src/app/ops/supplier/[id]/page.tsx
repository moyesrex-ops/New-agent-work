import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/Button";
import { Banner, Card, DataTable, StatusChip, type Status } from "@/components/Surfaces";
import { requireOperator } from "@/lib/auth/require";
import { copy, formatDateTime } from "@/lib/copy";
import { formatKobo, kobo } from "@/lib/money";
import { formatPhone } from "@/lib/phone";
import { openSupplierRecord } from "@/lib/services/operator";
import { notificationsFor } from "@/lib/services/notify";
import { fixTin, flagSupplier } from "../../actions";
import shell from "@/components/shell.module.css";

export const dynamic = "force-dynamic";

const INVOICE_STATUS: Record<string, Status> = {
  stamped: "stamped",
  queued: "waiting",
  sending: "waiting",
  rejected: "rejected",
  draft: "draft",
  disputed: "disputed",
};

/**
 * O4 Record view. Read-only apart from the TIN, audit-logged, reason required.
 *
 * The reason travels in the URL because it was already written to the audit
 * log by the action that got you here — refreshing this page writes another
 * row, which is correct: each read is a read.
 */
export default async function OperatorRecord({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ reason?: string; error?: string; corrected?: string }>;
}) {
  const principal = await requireOperator();
  const { id } = await params;
  const { reason, error, corrected } = await searchParams;

  if (!reason || reason.trim().length < 4) redirect("/ops/lookup?error=reason");

  const record = await openSupplierRecord(id, principal.operatorId, reason);
  if (!record) notFound();

  const { supplier, invoices, trail } = record;
  const messages = await notificationsFor("supplier", id);

  return (
    <>
      <div style={{ marginBottom: "var(--space-5)" }}>
        <Banner tone="warning">
          You are reading {supplier.businessName}&rsquo;s record. Logged against you, reason:
          &ldquo;{reason}&rdquo;.
        </Banner>
      </div>

      <h1 className={shell.title}>{supplier.businessName}</h1>

      {corrected ? (
        <div style={{ marginBottom: "var(--space-5)" }}>
          <Banner tone="neutral">TIN corrected. The change is in the audit log.</Banner>
        </div>
      ) : null}
      {error === "tin" ? (
        <div style={{ marginBottom: "var(--space-5)" }}>
          <Banner tone="danger">That is not a valid TIN. Nothing was changed.</Banner>
        </div>
      ) : null}

      <section className={shell.section}>
        <div className={shell.grid2}>
          <Card>
            <div className={shell.displayRow}>
              <p className={shell.displayLabel}>Phone</p>
              <p className={shell.displayValue}>{formatPhone(supplier.phone)}</p>
            </div>
            <div className={shell.displayRow}>
              <p className={shell.displayLabel}>TIN</p>
              <p className={shell.displayValue}>{supplier.tin ?? "None"}</p>
            </div>
            <div className={shell.displayRow}>
              <p className={shell.displayLabel}>Confirmed</p>
              <p className={shell.displayValue}>
                {supplier.confirmedAt ? formatDateTime(supplier.confirmedAt) : "Not yet"}
              </p>
            </div>
            <div className={shell.displayRow}>
              <p className={shell.displayLabel}>State</p>
              <p className={shell.displayValue}>
                {supplier.deletedAt
                  ? `Deleted ${formatDateTime(supplier.deletedAt)}`
                  : supplier.suspendedAt
                    ? `Suspended ${formatDateTime(supplier.suspendedAt)}`
                    : "Active"}
              </p>
            </div>
          </Card>

          <Card>
            <p className={shell.metricLabel}>Buyers</p>
            <ul className={shell.stackTight} style={{ marginTop: "var(--space-2)" }}>
              {supplier.links.map((link) => (
                <li key={link.id}>
                  {link.organisation.legalName}
                  <span className={shell.note}> · {link.status}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </section>

      <section className={shell.section}>
        <h2 className={shell.sectionTitle}>{copy.operator.correctTin}</h2>
        <form action={fixTin} className={shell.inlineForm}>
          <input type="hidden" name="supplierId" value={supplier.id} />
          <label className="visually-hidden" htmlFor="tin">
            TIN
          </label>
          <input
            id="tin"
            name="tin"
            defaultValue={supplier.tin ?? ""}
            placeholder="20481166-0001"
            className={shell.searchInput}
            required
          />
          <label className="visually-hidden" htmlFor="tin-reason">
            {copy.operator.reasonLabel}
          </label>
          <input
            id="tin-reason"
            name="reason"
            placeholder="Reason"
            className={shell.searchInput}
            required
            minLength={4}
          />
          <Button type="submit" variant="secondary" compact>
            {copy.operator.correctTin}
          </Button>
        </form>
        <p className={shell.note} style={{ marginTop: "var(--space-2)" }}>
          The only field support can change. Bank details cannot be edited here, by anyone.
        </p>
      </section>

      <section className={shell.section}>
        <h2 className={shell.sectionTitle}>Invoices</h2>
        <DataTable
          caption="Invoices for this supplier"
          rows={invoices}
          empty={<Card>No invoices.</Card>}
          columns={[
            { key: "number", header: "Invoice", render: (row) => row.invoiceNumber },
            { key: "buyer", header: "Buyer", render: (row) => row.organisation.legalName },
            {
              key: "status",
              header: "Status",
              render: (row) => <StatusChip status={INVOICE_STATUS[row.status] ?? "draft"} />,
            },
            { key: "irn", header: "NRS reference", render: (row) => row.irn ?? "—" },
            {
              key: "total",
              header: "Total",
              numeric: true,
              render: (row) => formatKobo(kobo(row.totalKobo)),
            },
            {
              key: "attempts",
              header: "Attempts",
              numeric: true,
              render: (row) => row.transmissions.length,
            },
          ]}
        />
      </section>

      <section className={shell.section}>
        <h2 className={shell.sectionTitle}>Messages we sent them</h2>
        <DataTable
          caption="Notification history"
          rows={messages}
          empty={<Card>None yet.</Card>}
          columns={[
            { key: "template", header: "Message", render: (row) => row.template },
            { key: "channel", header: "Channel", render: (row) => row.channel ?? "—" },
            { key: "state", header: "State", render: (row) => row.state },
            { key: "when", header: "Sent", render: (row) => formatDateTime(row.createdAt) },
          ]}
        />
      </section>

      <section className={shell.section}>
        <h2 className={shell.sectionTitle}>Audit trail</h2>
        <DataTable
          caption="Audit events for this supplier"
          rows={trail}
          empty={<Card>Nothing recorded.</Card>}
          columns={[
            { key: "action", header: "Action", render: (row) => row.action },
            { key: "actor", header: "Who", render: (row) => `${row.actorType} ${row.actorId ?? ""}` },
            { key: "reason", header: "Reason", render: (row) => row.reason ?? "—" },
            { key: "when", header: "When", render: (row) => formatDateTime(row.createdAt) },
          ]}
        />
      </section>

      <section className={shell.section}>
        <h2 className={shell.sectionTitle}>Raise a flag</h2>
        <form action={flagSupplier} className={shell.inlineForm}>
          <input type="hidden" name="supplierId" value={supplier.id} />
          <label className="visually-hidden" htmlFor="flag-reason">
            Why
          </label>
          <input
            id="flag-reason"
            name="reason"
            placeholder="What was reported"
            className={shell.searchInput}
            style={{ minWidth: 320 }}
            required
            minLength={4}
          />
          <Button type="submit" variant="secondary" compact>
            Flag for review
          </Button>
        </form>
        <p className={shell.note} style={{ marginTop: "var(--space-2)" }}>
          Flagging does not suspend anyone. Suspension is a separate decision on the flags screen.
        </p>
      </section>
    </>
  );
}
