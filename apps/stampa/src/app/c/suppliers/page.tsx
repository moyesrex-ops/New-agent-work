import Link from "next/link";
import { ButtonLink } from "@/components/Button";
import { Banner, DataTable, EmptyState, StatusChip, type Status } from "@/components/Surfaces";
import { requireBuyer } from "@/lib/auth/require";
import { copy } from "@/lib/copy";
import { formatPhone } from "@/lib/phone";
import { maskTin } from "@/lib/tin";
import { listSuppliers, type SupplierRow } from "@/lib/services/buyer";
import shell from "@/components/shell.module.css";

export const dynamic = "force-dynamic";

const FILTERS = [
  { value: "all", label: copy.buyer.suppliersFilterAll },
  { value: "live", label: copy.status.live },
  { value: "opened", label: copy.status.opened },
  { value: "invited", label: copy.status.invited },
  { value: "imported", label: copy.buyer.suppliersFilterNotInvited },
] as const;

/** Link statuses are a superset of chip statuses; anything unmapped is "invited". */
function chipStatus(status: string): Status {
  if (status === "live" || status === "opened" || status === "invited") return status;
  if (status === "deleted") return "stuck";
  return "draft";
}

/** B6 Supplier list. The operational surface. */
export default async function Suppliers({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; sent?: string; failed?: string; q?: string }>;
}) {
  const principal = await requireBuyer();
  const { status = "all", sent, failed, q = "" } = await searchParams;

  const all = await listSuppliers(principal.organisationId);
  const query = q.trim().toLowerCase();
  const rows = all.filter(
    (row) =>
      (status === "all" || row.status === status) &&
      (!query ||
        row.businessName.toLowerCase().includes(query) ||
        row.phone.includes(query) ||
        (row.vendorCode ?? "").toLowerCase().includes(query)),
  );

  return (
    <>
      <h1 className={shell.title}>{copy.buyer.suppliersHeading}</h1>

      {sent ? (
        <div style={{ marginBottom: "var(--space-5)" }}>
          <Banner tone={Number(failed) > 0 ? "warning" : "neutral"}>
            {copy.buyer.inviteSent(Number(sent))}
            {Number(failed) > 0 ? ` ${copy.buyer.inviteFailed(Number(failed))}` : ""}
          </Banner>
        </div>
      ) : null}

      <div
        style={{
          display: "flex",
          gap: "var(--space-4)",
          alignItems: "flex-end",
          flexWrap: "wrap",
          marginBottom: "var(--space-5)",
        }}
      >
        <nav aria-label={copy.a11y.filterByStatus} style={{ display: "flex", gap: "var(--space-3)" }}>
          {FILTERS.map((filter) => (
            <Link
              key={filter.value}
              href={`/c/suppliers?status=${filter.value}`}
              className={shell.navLink}
              aria-current={status === filter.value ? "page" : undefined}
              style={
                status === filter.value
                  ? { color: "var(--color-ink-900)", textDecoration: "underline" }
                  : undefined
              }
            >
              {filter.label}
            </Link>
          ))}
        </nav>

        {/* A GET form, so a filtered list is a URL an AP clerk can bookmark. */}
        <form method="get" style={{ marginLeft: "auto", display: "flex", gap: "var(--space-2)" }}>
          <input type="hidden" name="status" value={status} />
          <label className="visually-hidden" htmlFor="supplier-search">
            {copy.buyer.suppliersSearch}
          </label>
          <input
            id="supplier-search"
            name="q"
            defaultValue={q}
            placeholder={copy.buyer.suppliersSearchHint}
            className={shell.searchInput}
          />
          <button type="submit" className={shell.searchButton}>
            {copy.buyer.suppliersSearchCta}
          </button>
        </form>

        <ButtonLink href="/c/invite" compact>
          {copy.buyer.exposureCta}
        </ButtonLink>
      </div>

      <DataTable<SupplierRow>
        caption={copy.buyer.suppliersCaption}
        rows={rows}
        empty={
          <EmptyState
            heading={all.length ? copy.buyer.suppliersNoMatch : copy.buyer.suppliersEmpty}
            action={
              all.length ? (
                <ButtonLink href="/c/suppliers" variant="secondary">
                  {copy.buyer.suppliersClearFilter}
                </ButtonLink>
              ) : (
                <ButtonLink href="/c/upload">{copy.buyer.uploadCta}</ButtonLink>
              )
            }
          />
        }
        columns={[
          {
            key: "name",
            header: copy.buyer.suppliersColumns.vendor,
            render: (row) => <Link href={`/c/suppliers/${row.linkId}`}>{row.businessName}</Link>,
          },
          { key: "code", header: copy.buyer.suppliersColumns.code, render: (row) => row.vendorCode ?? "—" },
          { key: "phone", header: copy.buyer.suppliersColumns.phone, render: (row) => formatPhone(row.phone) },
          {
            key: "tin",
            header: copy.buyer.suppliersColumns.tin,
            render: (row) =>
              row.tin ? maskTin(row.tin) : <span className={shell.note}>missing</span>,
          },
          {
            key: "status",
            header: copy.buyer.suppliersColumns.status,
            render: (row) => <StatusChip status={chipStatus(row.status)} />,
          },
          {
            key: "stamped",
            header: copy.buyer.suppliersColumns.stamped,
            numeric: true,
            render: (row) => row.stampedCount,
          },
        ]}
      />
    </>
  );
}
