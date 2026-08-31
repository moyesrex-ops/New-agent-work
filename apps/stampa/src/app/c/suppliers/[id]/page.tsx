import { notFound } from "next/navigation";
import Link from "next/link";
import { Button, ButtonLink } from "@/components/Button";
import { Card, DataTable, EmptyState, StatusChip, type Status } from "@/components/Surfaces";
import { requireBuyer } from "@/lib/auth/require";
import { copy, formatDateTime } from "@/lib/copy";
import { formatKobo, kobo } from "@/lib/money";
import { formatPhone } from "@/lib/phone";
import { getSupplierLink, linkChipStatus } from "@/lib/services/buyer";
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
      <p>
        <Link href="/c/suppliers" className={shell.textLink}>
          {copy.buyer.detailBack}
        </Link>
      </p>
      <h1 className={shell.title}>{link.supplier.businessName}</h1>

      <section className={shell.section}>
        <div className={shell.grid2}>
          <Card>
            <div className={shell.displayRow}>
              <p className={shell.displayLabel}>{copy.buyer.detailStatus}</p>
              <p className={shell.displayValue}>
                <StatusChip status={linkChipStatus(link.status)} />
              </p>
            </div>
            <div className={shell.displayRow}>
              <p className={shell.displayLabel}>{copy.buyer.suppliersColumns.phone}</p>
              <p className={shell.displayValue}>{formatPhone(link.supplier.phone)}</p>
            </div>
            <div className={shell.displayRow}>
              <p className={shell.displayLabel}>{copy.buyer.fields.tin}</p>
              <p className={shell.displayValue}>
                {link.supplier.tin ?? copy.buyer.notProvided}
              </p>
            </div>
            <div className={shell.displayRow}>
              <p className={shell.displayLabel}>{copy.buyer.fields.vendorCode}</p>
              <p className={shell.displayValue}>{link.vendorCode ?? "—"}</p>
            </div>
          </Card>

          <Card>
            <div className={shell.displayRow}>
              <p className={shell.displayLabel}>{copy.buyer.detailInvited}</p>
              <p className={shell.displayValue}>
                {link.invitedAt ? formatDateTime(link.invitedAt) : copy.buyer.notYet}
              </p>
            </div>
            <div className={shell.displayRow}>
              <p className={shell.displayLabel}>{copy.buyer.detailOpened}</p>
              <p className={shell.displayValue}>
                {link.openedAt ? formatDateTime(link.openedAt) : copy.buyer.notYet}
              </p>
            </div>
            <div className={shell.displayRow}>
              <p className={shell.displayLabel}>{copy.buyer.detailActivated}</p>
              <p className={shell.displayValue}>
                {link.activatedAt ? formatDateTime(link.activatedAt) : copy.buyer.notYet}
              </p>
            </div>
            <div className={shell.displayRow}>
              <p className={shell.displayLabel}>{copy.buyer.detailLink}</p>
              <p className={shell.displayValue} style={{ wordBreak: "break-all" }}>
                {invitation ? appUrl(`/s/i/${invitation.code}`) : copy.buyer.noneSent}
              </p>
            </div>
          </Card>
        </div>

        {/* Bank details are displayed, never edited. They change only through a
            fresh vendor master upload, which is diffed and audited. */}
        <div className={shell.lockedRow} style={{ marginTop: "var(--space-4)" }}>
          <p className={shell.displayLabel}>{copy.confirm.paidInto}</p>
          <p className={shell.displayValue}>
            {link.bankName ? `${link.bankName} ••••${link.bankLast4 ?? "????"}` : copy.buyer.notInYourFile}
          </p>
          <p className={shell.note}>{copy.buyer.detailBankSource}</p>
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
            {copy.buyer.detailNudgeNote(link.organisation.legalName)}
          </p>
        </section>
      ) : null}

      <section className={shell.section}>
        <h2 className={shell.sectionTitle}>{copy.buyer.detailInvoicesHeading}</h2>
        <DataTable
          caption={copy.buyer.detailInvoicesCaption}
          rows={invoices}
          empty={
            <EmptyState
              heading={copy.buyer.detailInvoicesEmpty}
              body={
                link.status === "live"
                  ? copy.buyer.detailInvoicesEmptyLive
                  : copy.buyer.detailInvoicesEmptyNotLive
              }
              action={
                <ButtonLink href="/c/suppliers" variant="secondary">
                  {copy.buyer.detailBack}
                </ButtonLink>
              }
            />
          }
          columns={[
            { key: "number", header: copy.buyer.invoicesColumns.invoice, render: (row) => row.invoiceNumber },
            {
              key: "status",
              header: copy.buyer.suppliersColumns.status,
              render: (row) => <StatusChip status={INVOICE_STATUS[row.status] ?? "draft"} />,
            },
            { key: "irn", header: copy.buyer.invoicesColumns.reference, render: (row) => row.irn ?? "—" },
            {
              key: "total",
              header: copy.buyer.invoicesColumns.total,
              numeric: true,
              render: (row) => formatKobo(kobo(row.totalKobo)),
            },
            {
              key: "stamped",
              header: copy.buyer.invoicesColumns.stamped,
              render: (row) => (row.stampedAt ? formatDateTime(row.stampedAt) : "—"),
            },
          ]}
        />
      </section>
    </>
  );
}
