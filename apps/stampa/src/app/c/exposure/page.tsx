import { ButtonLink } from "@/components/Button";
import { Card, DocumentCard, EmptyState } from "@/components/Surfaces";
import { requireBuyer } from "@/lib/auth/require";
import { copy, formatDate } from "@/lib/copy";
import { formatKobo } from "@/lib/money";
import {
  ASSUMED_ANNUAL_SPEND_KOBO,
  computeExposure,
  getOrganisation,
  listSuppliers,
} from "@/lib/services/buyer";
import shell from "@/components/shell.module.css";

export const dynamic = "force-dynamic";

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
      <EmptyState
        heading={copy.buyer.overviewEmpty}
        action={<ButtonLink href="/c/upload">{copy.buyer.uploadCta}</ButtonLink>}
      />
    );
  }

  const exposure = await computeExposure(principal.organisationId, actor);
  const invitable = suppliers.filter((row) => row.status !== "live");

  if (exposure.exposedVendors === 0) {
    return (
      <DocumentCard label="Exposure report">
        <h1 className={shell.title}>{copy.buyer.exposureClear(exposure.totalVendors)}</h1>
        <p className={shell.lede}>
          Every vendor we could check has transmitted at least one stamped invoice through Stampa.
        </p>
        <p className={shell.note} style={{ marginTop: "var(--space-4)" }}>
          {copy.buyer.exposureMethod(exposure.totalVendors, formatDate(new Date()))}
        </p>
      </DocumentCard>
    );
  }

  return (
    <>
      <DocumentCard label="Input VAT exposure report">
        <p className={shell.note}>{organisation?.legalName}</p>
        <h1 className={shell.title} style={{ marginTop: "var(--space-2)" }}>
          {copy.buyer.exposureHeading(exposure.exposedVendors, exposure.totalVendors)}
        </h1>

        <p className={shell.metricLabel} style={{ marginTop: "var(--space-6)" }}>
          {copy.buyer.exposureSubhead}
        </p>
        <p className={shell.display} style={{ fontFamily: "var(--font-family-mono)" }}>
          NGN {formatKobo(exposure.vatAtRiskKobo)}
        </p>

        <div style={{ marginTop: "var(--space-6)" }}>
          <p className={shell.note}>
            {copy.buyer.exposureMethod(exposure.totalVendors, formatDate(new Date()))}
          </p>
          {exposure.uncheckableVendors ? (
            <p className={shell.note}>
              {copy.buyer.exposureUncheckable(exposure.uncheckableVendors)}
            </p>
          ) : null}
          <p className={shell.note}>
            {exposure.spendSource === "buyer_data"
              ? "Spend figures are the ones in your own upload."
              : `Your upload carried no spend column, so this uses a stated assumption of ${formatKobo(ASSUMED_ANNUAL_SPEND_KOBO)} of annual spend per vendor. Upload a file with a spend column and this becomes your own number.`}
          </p>
          <p className={shell.note}>
            One quarter of annual spend at the 7.5% standard rate. Vendors with no usable TIN are
            counted as uncheckable, not as exposed.
          </p>
        </div>
      </DocumentCard>

      <section className={shell.section} style={{ marginTop: "var(--space-6)" }}>
        <div className={shell.metricGrid}>
          <Card>
            <p className={shell.metricLabel}>Compliant</p>
            <p className={shell.metricValue}>{exposure.compliantVendors}</p>
          </Card>
          <Card>
            <p className={shell.metricLabel}>Not compliant</p>
            <p className={shell.metricValue}>{exposure.exposedVendors}</p>
          </Card>
          <Card>
            <p className={shell.metricLabel}>Could not be checked</p>
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
        {invitable.length} of them have not finished signing up.
      </p>
    </>
  );
}
