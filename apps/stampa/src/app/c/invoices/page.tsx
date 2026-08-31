import { ButtonLink } from "@/components/Button";
import { DataTable, EmptyState } from "@/components/Surfaces";
import { requireBuyer } from "@/lib/auth/require";
import { copy, formatDateTime } from "@/lib/copy";
import { formatKobo, kobo } from "@/lib/money";
import { maskTin } from "@/lib/tin";
import { listInboundInvoices } from "@/lib/services/invoices";
import shell from "@/components/shell.module.css";

export const dynamic = "force-dynamic";

/**
 * B9 Inbound invoices. This is the screen that feeds the VAT return, so the
 * NRS reference is the first column: it is the field that makes the input
 * credit claimable, and it is what a Tax Manager is reconciling against.
 */
export default async function InboundInvoices() {
  const principal = await requireBuyer();
  const rows = await listInboundInvoices(principal.organisationId);

  const total = rows.reduce((sum, row) => sum + row.vatKobo, 0);

  return (
    <>
      <div style={{ display: "flex", alignItems: "baseline", gap: "var(--space-4)" }}>
        <h1 className={shell.title}>{copy.buyer.invoicesHeading}</h1>
        {rows.length ? (
          <ButtonLink
            href="/c/invoices/export"
            variant="secondary"
            compact
            style={{ marginLeft: "auto" }}
          >
            {copy.buyer.exportCta}
          </ButtonLink>
        ) : null}
      </div>

      {rows.length ? (
        <p className={shell.note} style={{ marginBottom: "var(--space-5)" }}>
          {rows.length} stamped invoices · input VAT {formatKobo(kobo(total))}
        </p>
      ) : null}

      <DataTable
        caption="Stamped invoices received from your suppliers"
        rows={rows}
        limit={500}
        empty={
          <EmptyState
            heading={copy.buyer.invoicesEmpty}
            body="They appear here the moment a supplier's invoice is stamped by the NRS."
            action={<ButtonLink href="/c/suppliers">{copy.buyer.suppliersHeading}</ButtonLink>}
          />
        }
        columns={[
          { key: "irn", header: "NRS reference", render: (row) => row.irn ?? "—" },
          { key: "number", header: "Invoice", render: (row) => row.invoiceNumber },
          { key: "supplier", header: "Supplier", render: (row) => row.supplier.businessName },
          {
            key: "tin",
            header: "Supplier TIN",
            render: (row) => (row.supplier.tin ? maskTin(row.supplier.tin) : "—"),
          },
          {
            key: "vat",
            header: "VAT",
            numeric: true,
            render: (row) => formatKobo(kobo(row.vatKobo)),
          },
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
    </>
  );
}
