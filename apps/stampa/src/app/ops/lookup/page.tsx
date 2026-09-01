import Link from "next/link";
import { Button } from "@/components/Button";
import { Banner, Card, EmptyState } from "@/components/Surfaces";
import { requireOperator } from "@/lib/auth/require";
import { copy } from "@/lib/copy";
import { lookup } from "@/lib/services/operator";
import { openRecord } from "../actions";
import shell from "@/components/shell.module.css";

export const dynamic = "force-dynamic";

/**
 * O3 Lookup. Answer a support call in under thirty seconds.
 *
 * Searching is free. Opening a record is not: it needs a typed reason and it
 * writes an audit row before the record is read.
 */
export default async function Lookup({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; error?: string }>;
}) {
  await requireOperator();
  const { q = "", error } = await searchParams;
  const hits = q ? await lookup(q) : [];

  return (
    <>
      <h1 className={shell.title}>{copy.operator.lookupHeading}</h1>

      <form method="get" className={shell.inlineForm} style={{ marginBottom: "var(--space-6)" }}>
        <label className="visually-hidden" htmlFor="ops-search">
          {copy.operator.lookupPlaceholder}
        </label>
        <input
          id="ops-search"
          name="q"
          defaultValue={q}
          placeholder={copy.operator.lookupPlaceholder}
          className={shell.searchInput}
          style={{ minWidth: 340 }}
          autoFocus
        />
        <Button type="submit" compact>
          Search
        </Button>
      </form>

      {error === "reason" ? (
        <div style={{ marginBottom: "var(--space-5)" }}>
          <Banner tone="danger">{copy.operator.reasonRequired}</Banner>
        </div>
      ) : null}

      {q && !hits.length ? <EmptyState heading={copy.operator.lookupEmpty} /> : null}

      <div className={shell.stack}>
        {hits.map((hit) => (
          <Card key={`${hit.kind}-${hit.id}`}>
            <div className={shell.row}>
              <div>
                <p style={{ fontWeight: "var(--font-weight-semibold)" }}>{hit.title}</p>
                <p className={shell.note}>{hit.detail}</p>
              </div>
              {hit.kind === "supplier" ? (
                <form action={openRecord} className={shell.inlineForm}>
                  <input type="hidden" name="supplierId" value={hit.id} />
                  <label className="visually-hidden" htmlFor={`reason-${hit.id}`}>
                    {copy.operator.reasonLabel}
                  </label>
                  <input
                    id={`reason-${hit.id}`}
                    name="reason"
                    placeholder={copy.operator.reasonLabel}
                    className={shell.searchInput}
                    required
                    minLength={4}
                  />
                  <Button type="submit" variant="secondary" compact>
                    Open record
                  </Button>
                </form>
              ) : (
                <Link href={`/ops/lookup?q=${encodeURIComponent(hit.title.split(" · ")[1] ?? "")}`}>
                  Find the supplier
                </Link>
              )}
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
