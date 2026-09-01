import { Button } from "@/components/Button";
import { Banner, Card, EmptyState } from "@/components/Surfaces";
import { requireOperator } from "@/lib/auth/require";
import { copy, formatDateTime } from "@/lib/copy";
import { listFlags } from "@/lib/services/operator";
import { decideFlag } from "../actions";
import shell from "@/components/shell.module.css";

export const dynamic = "force-dynamic";

/**
 * O5 Flags. Act on scam reports.
 *
 * Two outcomes and no third: suspend, which stops transmission and nothing
 * else, or dismiss. Both are audited with a reason. Nothing here deletes a
 * record — a suspended supplier's stamped invoices are still tax records.
 */
export default async function Flags({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireOperator();
  const { error } = await searchParams;
  const open = await listFlags("open");

  return (
    <>
      <h1 className={shell.title}>{copy.operator.flagsHeading}</h1>

      {error === "reason" ? (
        <div style={{ marginBottom: "var(--space-5)" }}>
          <Banner tone="danger">{copy.operator.reasonRequired}</Banner>
        </div>
      ) : null}

      {!open.length ? (
        <EmptyState heading="No open flags." body="Reports raised from a record appear here." />
      ) : (
        <div className={shell.stack}>
          {open.map((flag) => (
            <Card key={flag.id}>
              <p style={{ fontWeight: "var(--font-weight-semibold)" }}>{flag.reason}</p>
              <p className={shell.note}>
                {flag.subjectType} {flag.subjectId} · raised by {flag.raisedBy} ·{" "}
                {formatDateTime(flag.createdAt)}
              </p>

              <form action={decideFlag} className={shell.inlineForm} style={{ marginTop: "var(--space-4)" }}>
                <input type="hidden" name="flagId" value={flag.id} />
                <label className="visually-hidden" htmlFor={`decision-${flag.id}`}>
                  {copy.operator.reasonLabel}
                </label>
                <input
                  id={`decision-${flag.id}`}
                  name="reason"
                  placeholder="What you found"
                  className={shell.searchInput}
                  style={{ minWidth: 300 }}
                  required
                  minLength={4}
                />
                <Button type="submit" name="resolution" value="suspend" variant="destructive" compact>
                  {copy.operator.suspend}
                </Button>
                <Button type="submit" name="resolution" value="dismiss" variant="secondary" compact>
                  {copy.operator.dismiss}
                </Button>
              </form>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
