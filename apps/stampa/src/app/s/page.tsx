import { ButtonLink } from "@/components/Button";
import { EmptyState, ListRow, type Status } from "@/components/Surfaces";
import { copy, formatDate } from "@/lib/copy";
import { formatNaira } from "@/lib/money";
import { kobo } from "@/lib/money";
import { requireSupplier } from "@/lib/auth/require";
import { listInvoicesForSupplier } from "@/lib/services/invoices";
import shell from "@/components/shell.module.css";

export const dynamic = "force-dynamic";

/** Invoice status maps onto exactly the six chips, and nothing invents a seventh. */
const STATUS: Record<string, Status> = {
  draft: "draft",
  queued: "waiting",
  sending: "waiting",
  stamped: "stamped",
  rejected: "rejected",
  disputed: "disputed",
};

/** S5 — Home. The return surface. */
export default async function SupplierHome() {
  const principal = await requireSupplier();
  const invoices = await listInvoicesForSupplier(principal.supplierId);

  return (
    <div className={shell.stack}>
      <h1 className={shell.title}>{copy.home.title}</h1>

      {invoices.length === 0 ? (
        <EmptyState
          heading={copy.home.emptyHeading}
          body={copy.home.emptyBody}
          action={<ButtonLink href="/s/new">{copy.home.cta}</ButtonLink>}
        />
      ) : (
        <>
          <div>
            {invoices.map((invoice) => (
              <ListRow
                key={invoice.id}
                href={`/s/invoice/${invoice.id}`}
                title={invoice.organisation.legalName}
                amount={formatNaira(kobo(invoice.totalKobo))}
                status={STATUS[invoice.status] ?? "draft"}
                meta={`${invoice.invoiceNumber} · ${formatDate(invoice.createdAt)}`}
              />
            ))}
          </div>
          <div className={shell.actionBar}>
            <ButtonLink href="/s/new" block>
              {copy.home.cta}
            </ButtonLink>
          </div>
        </>
      )}
    </div>
  );
}
