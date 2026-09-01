import { ButtonLink } from "@/components/Button";
import { Card, EmptyState, StatusChip } from "@/components/Surfaces";
import { requireBuyer } from "@/lib/auth/require";
import { copy, formatDateTime } from "@/lib/copy";
import { formatNaira } from "@/lib/money";
import { computeExposure, getOrganisation, listSuppliers } from "@/lib/services/buyer";
import { listInboundInvoices } from "@/lib/services/invoices";
import shell from "@/components/shell.module.css";

export const dynamic = "force-dynamic";

/**
 * B2 Overview. The monthly return reason.
 *
 * The exposure figure is repeated here rather than hidden behind a link,
 * because the reason a Financial Controller opens this console in month three
 * is the same reason they opened it in week one.
 */
export default async function Overview() {
  const principal = await requireBuyer();
  const actor = { type: "buyer", id: principal.userId } as const;

  const [organisation, suppliers] = await Promise.all([
    getOrganisation(principal.organisationId),
    listSuppliers(principal.organisationId),
  ]);

  if (!suppliers.length) {
    return (
      <>
        <h1 className={shell.title}>{copy.buyer.overviewHeading}</h1>
        <EmptyState
          heading={copy.buyer.overviewEmpty}
          body={copy.buyer.overviewEmptyBody}
          action={<ButtonLink href="/c/upload">{copy.buyer.uploadCta}</ButtonLink>}
        />
      </>
    );
  }

  const [exposure, inbound] = await Promise.all([
    computeExposure(principal.organisationId, actor),
    listInboundInvoices(principal.organisationId),
  ]);

  const live = suppliers.filter((row) => row.status === "live").length;
  const invited = suppliers.filter((row) => row.status === "invited").length;
  const opened = suppliers.filter((row) => row.status === "opened").length;

  return (
    <>
      <h1 className={shell.title}>{copy.buyer.overviewHeading}</h1>
      <p className={shell.note} style={{ marginBottom: "var(--space-6)" }}>
        {organisation?.legalName}
      </p>

      <section className={shell.section}>
        <div className={shell.metricGrid}>
          <Card>
            <p className={shell.metricLabel}>{copy.buyer.exposureSubhead}</p>
            {/* Carries NGN. A seven-figure number with no currency beside it
                is the one metric on this page nobody should have to infer. */}
            <p className={shell.metricValue}>{formatNaira(exposure.vatAtRiskKobo)}</p>
          </Card>
          <Card>
            <p className={shell.metricLabel}>{copy.buyer.overviewExposed}</p>
            <p className={shell.metricValue}>{exposure.exposedVendors}</p>
          </Card>
          <Card>
            <p className={shell.metricLabel}>{copy.buyer.overviewLive}</p>
            <p className={shell.metricValue}>{live}</p>
          </Card>
          <Card>
            <p className={shell.metricLabel}>{copy.buyer.overviewReceived}</p>
            <p className={shell.metricValue}>{inbound.length}</p>
          </Card>
        </div>
      </section>

      <section className={shell.section}>
        <h2 className={shell.sectionTitle}>{copy.buyer.overviewWhere}</h2>
        {/* A zero row is dropped rather than printed. "0 opened the link and
            stopped" is a sentence about nobody. */}
        <div className={shell.stackTight}>
          {live ? (
            <p>
              <StatusChip status="live" /> {copy.buyer.overviewLiveLine(live)}
            </p>
          ) : null}
          {opened ? (
            <p>
              <StatusChip status="opened" /> {copy.buyer.overviewOpenedLine(opened)}
            </p>
          ) : null}
          {invited ? (
            <p>
              <StatusChip status="invited" /> {copy.buyer.overviewInvitedLine(invited)}
            </p>
          ) : null}
        </div>
        <div style={{ marginTop: "var(--space-5)", display: "flex", gap: "var(--space-3)" }}>
          {/* The primary action is the one that changes the number above it.
              Opening a list does not. */}
          <ButtonLink href="/c/invite" compact>
            {copy.buyer.exposureCta}
          </ButtonLink>
          <ButtonLink href="/c/exposure" variant="secondary" compact>
            {copy.buyer.exposureSeeList}
          </ButtonLink>
        </div>
      </section>

      {inbound.length ? (
        <section className={shell.section}>
          <h2 className={shell.sectionTitle}>{copy.buyer.invoicesHeading}</h2>
          <p className={shell.note}>
            {copy.buyer.overviewMostRecent(
              formatDateTime(inbound[0].stampedAt ?? inbound[0].createdAt),
            )}
          </p>
          <div style={{ marginTop: "var(--space-4)" }}>
            <ButtonLink href="/c/invoices" variant="secondary" compact>
              {copy.buyer.overviewSeeAll(inbound.length)}
            </ButtonLink>
          </div>
        </section>
      ) : null}
    </>
  );
}
