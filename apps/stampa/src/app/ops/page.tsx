import { ButtonLink } from "@/components/Button";
import { Card } from "@/components/Surfaces";
import { requireOperator } from "@/lib/auth/require";
import { copy } from "@/lib/copy";
import { metrics } from "@/lib/services/operator";
import shell from "@/components/shell.module.css";

export const dynamic = "force-dynamic";

/** O1 Metrics. One question: is the north star moving today. */
export default async function OperatorMetrics() {
  const principal = await requireOperator();
  const today = await metrics();

  return (
    <>
      <h1 className={shell.title}>{copy.operator.metricsHeading}</h1>
      <p className={shell.note} style={{ marginBottom: "var(--space-6)" }}>
        Signed in as {principal.operatorId}
      </p>

      <section className={shell.section}>
        <div className={shell.metricGrid}>
          <Card>
            <p className={shell.metricLabel}>{copy.operator.northStar} today</p>
            <p className={shell.metricValue}>{today.stampedToday}</p>
          </Card>
          <Card>
            <p className={shell.metricLabel}>{copy.operator.northStar} this week</p>
            <p className={shell.metricValue}>{today.stampedThisWeek}</p>
          </Card>
          <Card>
            <p className={shell.metricLabel}>Suppliers live</p>
            <p className={shell.metricValue}>{today.suppliersLive}</p>
          </Card>
          <Card>
            <p className={shell.metricLabel}>Opened and stuck</p>
            <p className={shell.metricValue}>{today.suppliersStuck}</p>
          </Card>
          <Card>
            <p className={shell.metricLabel}>Waiting to transmit</p>
            <p className={shell.metricValue}>{today.queued}</p>
          </Card>
          <Card>
            <p className={shell.metricLabel}>Not stamped</p>
            <p className={shell.metricValue}>{today.failing}</p>
          </Card>
        </div>
      </section>

      <div style={{ display: "flex", gap: "var(--space-3)" }}>
        <ButtonLink href="/ops/failures" compact>
          {copy.operator.failuresHeading}
        </ButtonLink>
        <ButtonLink href="/ops/lookup" variant="secondary" compact>
          {copy.operator.lookupHeading}
        </ButtonLink>
      </div>

      <p className={shell.note} style={{ marginTop: "var(--space-6)" }}>
        The morning routine: clear the failure queue, then call every supplier in it. That is the
        job in month one and it is not automated on purpose.
      </p>
    </>
  );
}
