import { ButtonLink } from "@/components/Button";
import { EmptyState, ListRow, type Status } from "@/components/Surfaces";
import { copy, formatDate } from "@/lib/copy";
import { formatNaira } from "@/lib/money";
import { kobo } from "@/lib/money";
import { requireSupplier } from "@/lib/auth/require";
import { countInvoicesForSupplier, listInvoicesForSupplier } from "@/lib/services/invoices";
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

/**
 * Below this the list fits on one screen and a search box is furniture that
 * costs a tap target and earns nothing. Above it, scrolling to find last
 * March's invoice to Dangote is the actual job.
 */
const SEARCH_APPEARS_AT = 8;

/** S5 — Home. The return surface. */
export default async function SupplierHome({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const principal = await requireSupplier();
  const { q = "" } = await searchParams;
  const term = q.trim();

  const [invoices, total] = await Promise.all([
    listInvoicesForSupplier(principal.supplierId, term),
    countInvoicesForSupplier(principal.supplierId),
  ]);

  // Never on the true-empty screen: the first thing a new supplier sees should
  // be one button, not a box asking them to search nothing.
  const showSearch = total >= SEARCH_APPEARS_AT || term !== "";

  return (
    <div className={shell.stack}>
      <h1 className={shell.title}>{copy.home.title}</h1>

      {showSearch ? (
        // GET, so a search is a URL: support can say "open this link" instead
        // of "type this into the box at the top".
        <form method="get" className={shell.findRow} role="search">
          <label className="visually-hidden" htmlFor="find-invoice">
            {copy.home.search.label}
          </label>
          <input
            id="find-invoice"
            name="q"
            type="search"
            defaultValue={term}
            placeholder={copy.home.search.placeholder}
            className={shell.findInput}
            autoComplete="off"
          />
          <button type="submit" className={shell.findButton}>
            {copy.home.search.submit}
          </button>
        </form>
      ) : null}

      {term ? (
        <p className={shell.note} role="status">
          {copy.home.search.found(invoices.length)}{" "}
          <a href="/s">{copy.home.search.clear}</a>
        </p>
      ) : null}

      {invoices.length === 0 ? (
        term ? (
          <EmptyState
            heading={copy.home.search.emptyHeading}
            body={copy.home.search.emptyBody}
            action={
              <ButtonLink href="/s" variant="secondary">
                {copy.home.search.clear}
              </ButtonLink>
            }
          />
        ) : (
          <EmptyState
            heading={copy.home.emptyHeading}
            body={copy.home.emptyBody}
            action={<ButtonLink href="/s/new">{copy.home.cta}</ButtonLink>}
          />
        )
      ) : (
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
      )}

      {/* Outside the empty branch: the way to a new invoice never disappears
          because a search returned nothing. */}
      {invoices.length > 0 ? (
        <div className={shell.actionBar}>
          <ButtonLink href="/s/new" block>
            {copy.home.cta}
          </ButtonLink>
        </div>
      ) : null}
    </div>
  );
}
