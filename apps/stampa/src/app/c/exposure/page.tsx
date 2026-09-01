import { ButtonLink } from "@/components/Button";
import { Card, DocumentCard, EmptyState } from "@/components/Surfaces";
import { requireBuyer } from "@/lib/auth/require";
import { copy, formatDate, formatDateTime } from "@/lib/copy";
import { formatNaira } from "@/lib/money";
import {
  ASSUMED_ANNUAL_SPEND_KOBO,
  computeExposure,
  type Exposure,
  getOrganisation,
  listSuppliers,
} from "@/lib/services/buyer";
import shell from "@/components/shell.module.css";

export const dynamic = "force-dynamic";

/**
 * The provenance line. Falls back to an undated form rather than inventing a
 * date, because a wrong date on a document whose whole job is to be auditable
 * is worse than no date at all.
 */
function method(exposure: Exposure): string {
  return exposure.vendorsLoadedAt
    ? copy.buyer.exposureMethod(exposure.totalVendors, formatDate(exposure.vendorsLoadedAt))
    : copy.buyer.exposureMethodUndated(exposure.totalVendors);
}

/**
 * B5 Exposure report. The wedge, and the screenshot that gets forwarded to the
 * Financial Controller.
 *
 * Everything on this page has to survive being audited by someone who did not
 * generate it, so the method line is not a footnote: it names the row count,
 * the date, and whether the spend figure came from their file or from a stated
 * assumption. A number a Financial Controller cannot source is a number they
 * will not forward.
 */
export default async function ExposureReport() {
  const principal = await requireBuyer();
  const actor = { type: "buyer", id: principal.userId } as const;

  const [organisation, suppliers] = await Promise.all([
    getOrganisation(principal.organisationId),
    listSuppliers(principal.organisationId),
  ]);

  if (!suppliers.length) {
    return (
      <>
        <h1 className={shell.title}>{copy.buyer.exposureClearLabel}</h1>
        <EmptyState
          heading={copy.buyer.overviewEmpty}
          body={copy.buyer.overviewEmptyBody}
          action={<ButtonLink href="/c/upload">{copy.buyer.uploadCta}</ButtonLink>}
        />
      </>
    );
  }

  const exposure = await computeExposure(principal.organisationId, actor);
  const invitable = suppliers.filter((row) => row.status !== "live");

  if (exposure.exposedVendors === 0) {
    return (
      <DocumentCard label={copy.buyer.exposureClearLabel}>
        <h1 className={shell.title}>{copy.buyer.exposureClear(exposure.totalVendors)}</h1>
        <p className={shell.lede}>{copy.buyer.exposureClearBody}</p>
        <p className={shell.note} style={{ marginTop: "var(--space-4)" }}>
          {method(exposure)}
        </p>
      </DocumentCard>
    );
  }

  return (
    <>
      <DocumentCard label={copy.buyer.exposureLabel}>
        <p className={shell.note}>{organisation?.legalName}</p>
        <h1 className={shell.title} style={{ marginTop: "var(--space-2)" }}>
          {copy.buyer.exposureHeading(exposure.exposedVendors, exposure.totalVendors)}
        </h1>

        <p className={shell.metricLabel} style={{ marginTop: "var(--space-6)" }}>
          {copy.buyer.exposureSubhead}
        </p>
        <p className={shell.display} style={{ fontFamily: "var(--font-family-mono)" }}>
          {formatNaira(exposure.vatAtRiskKobo)}
        </p>

        {/* Every claim this number rests on, in the document that makes it.
            A figure a Financial Controller cannot source is a figure they will
            not forward, and forwarding it is the entire point of the screen. */}
        <div className={shell.method}>
          <p className={shell.note}>{method(exposure)}</p>
          {exposure.uncheckableVendors ? (
            <p className={shell.note}>
              {copy.buyer.exposureUncheckable(exposure.uncheckableVendors)}
            </p>
          ) : null}
          <p className={shell.note}>
            {exposure.spendSource === "buyer_data"
              ? copy.buyer.exposureSpendYours
              : copy.buyer.exposureSpendAssumed(formatNaira(ASSUMED_ANNUAL_SPEND_KOBO))}
          </p>
          <p className={shell.note}>{copy.buyer.exposureRate}</p>
          <p className={shell.note}>{copy.buyer.exposureGeneratedAt(formatDateTime(new Date()))}</p>
        </div>
      </DocumentCard>

      <section className={shell.section} style={{ marginTop: "var(--space-6)" }}>
        <div className={shell.metricGrid}>
          <Card>
            <p className={shell.metricLabel}>{copy.buyer.exposureCompliant}</p>
            <p className={shell.metricValue}>{exposure.compliantVendors}</p>
          </Card>
          <Card>
            <p className={shell.metricLabel}>{copy.buyer.exposureNotCompliant}</p>
            <p className={shell.metricValue}>{exposure.exposedVendors}</p>
          </Card>
          <Card>
            <p className={shell.metricLabel}>{copy.buyer.exposureUncheckableLabel}</p>
            <p className={shell.metricValue}>{exposure.uncheckableVendors}</p>
          </Card>
        </div>
      </section>

      <div style={{ display: "flex", gap: "var(--space-3)" }}>
        <ButtonLink href="/c/invite">{copy.buyer.exposureCta}</ButtonLink>
        <ButtonLink href="/c/suppliers" variant="secondary">
          {copy.buyer.exposureSeeList}
        </ButtonLink>
      </div>
      <p className={shell.note} style={{ marginTop: "var(--space-3)" }}>
        {copy.buyer.exposureRemaining(invitable.length, exposure.totalVendors)}
      </p>
    </>
  );
}
