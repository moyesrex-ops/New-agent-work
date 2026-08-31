import { notFound } from "next/navigation";
import Link from "next/link";
import { Button, ButtonLink } from "@/components/Button";
import { Card, DataTable, EmptyState, StatusChip, type Status } from "@/components/Surfaces";
import { requireBuyer } from "@/lib/auth/require";
import { copy, formatDateTime } from "@/lib/copy";
import { formatKobo, kobo } from "@/lib/money";
import { formatPhone } from "@/lib/phone";
import { maskTin } from "@/lib/tin";
import { getSupplierLink } from "@/lib/services/buyer";
import { appUrl } from "@/lib/services/notify";
import { nudge } from "../../actions";
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

/** B7 Supplier detail. Everything the AP clerk needs before they pick up the phone. */
export default async function SupplierDetail({ params }: { params: Promise<{ id: string }> }) {
  const principal = await requireBuyer();
  const { id } = await params;

  const found = await getSupplierLink(principal.organisationId, id);
  if (!found) notFound();

  const { link, invoices } = found;
  const invitation = link.invitations.at(-1);
  const nudgeThis = nudge.bind(null, link.id);

  return (
    <>
      <p className={shell.note}>
        <Link href="/c/suppliers">{copy.buyer.suppliersHeading}</Link>
      </p>
      <h1 className={shell.title}>{link.supplier.businessName}</h1>

      <section className={shell.section}>
        <div className={shell.grid2}>
          <Card>
            <div className={shell.displayRow}>
              <p className={shell.displayLabel}>Status</p>
              <p className={shell.displayValue}>
                <StatusChip status={link.status === "live" ? "live" : link.status === "opened" ? "opened" : "invited"} />
              </p>
            </div>
            <div className={shell.displayRow}>
              <p className={shell.displayLabel}>Phone</p>
              <p className={shell.displayValue}>{formatPhone(link.supplier.phone)}</p>
            </div>
            <div className={shell.displayRow}>
              <p className={shell.displayLabel}>TIN</p>
              <p className={shell.displayValue}>
                {link.supplier.tin ? maskTin(link.supplier.tin) : "Not provided"}
              </p>
            </div>
            <div className={shell.displayRow}>
              <p className={shell.displayLabel}>Vendor code</p>
              <p className={shell.displayValue}>{link.vendorCode ?? "—"}</p>
            </div>
          </Card>

          <Card>
            <div className={shell.displayRow}>
              <p className={shell.displayLabel}>Invited</p>
              <p className={shell.displayValue}>
                {link.invitedAt ? formatDateTime(link.invitedAt) : "Not yet"}
              </p>
            </div>
            <div className={shell.displayRow}>
              <p className={shell.displayLabel}>Opened the link</p>
              <p className={shell.displayValue}>
                {link.openedAt ? formatDateTime(link.openedAt) : "Not yet"}
              </p>
            </div>
            <div className={shell.displayRow}>
              <p className={shell.displayLabel}>Finished signing up</p>
              <p className={shell.displayValue}>
                {link.activatedAt ? formatDateTime(link.activatedAt) : "Not yet"}
              </p>
            </div>
            <div className={shell.displayRow}>
              <p className={shell.displayLabel}>Their link</p>
              <p className={shell.displayValue} style={{ wordBreak: "break-all" }}>
                {invitation ? appUrl(`/s/i/${invitation.code}`) : "None sent"}
              </p>
            </div>
          </Card>
        </div>

        {/* Bank details are displayed, never edited. They change only through a
            fresh vendor master upload, which is diffed and audited. */}
        <div className={shell.lockedRow} style={{ marginTop: "var(--space-4)" }}>
          <p className={shell.displayLabel}>{copy.confirm.paidInto}</p>
          <p className={shell.displayValue}>
            {link.bankName ? `${link.bankName} ••••${link.bankLast4 ?? "????"}` : "Not in your file"}
          </p>
          <p className={shell.note}>
            From your vendor master. Change it there and re-upload — it cannot be edited here, by
            you or by the supplier.
          </p>
        </div>
      </section>

      {link.status !== "live" ? (
        <section className={shell.section}>
          <form action={nudgeThis}>
            <Button type="submit" compact>
              {copy.buyer.nudge}
            </Button>
          </form>
          <p className={shell.note} style={{ marginTop: "var(--space-2)" }}>
            Sends the invitation again in {link.organisation.legalName}&rsquo;s name, on WhatsApp
            with SMS behind it.
          </p>
        </section>
      ) : null}

      <section className={shell.section}>
        <h2 className={shell.sectionTitle}>Their invoices to you</h2>
        <DataTable
          caption="Invoices from this supplier"
          rows={invoices}
          empty={
            <EmptyState
              heading="Nothing yet."
              body={
                link.status === "live"
                  ? "They have finished signing up but have not sent an invoice."
                  : "They have not finished signing up."
              }
              action={
                <ButtonLink href="/c/suppliers" variant="secondary">
                  Back to suppliers
                </ButtonLink>
              }
            />
          }
          columns={[
            { key: "number", header: "Invoice", render: (row) => row.invoiceNumber },
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
              key: "stamped",
              header: "Stamped",
              render: (row) => (row.stampedAt ? formatDateTime(row.stampedAt) : "—"),
            },
          ]}
        />
      </section>
    </>
  );
}
