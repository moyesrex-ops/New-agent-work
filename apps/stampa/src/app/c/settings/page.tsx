import { Button, ButtonLink } from "@/components/Button";
import { Card } from "@/components/Surfaces";
import { requireBuyer } from "@/lib/auth/require";
import { BRAND, copy } from "@/lib/copy";
import { maskTin } from "@/lib/tin";
import { getOrganisation, listSuppliers } from "@/lib/services/buyer";
import { signOutBuyer } from "../actions";
import shell from "@/components/shell.module.css";

export const dynamic = "force-dynamic";

/**
 * B10 Settings.
 *
 * Billing is deliberately read-only. Nothing in the product takes a card in v1
 * (Flow 5) — a Stampa invoice is issued by hand and paid by bank transfer,
 * which with fewer than twenty customers is not a bottleneck. Saying that in
 * plain words is better than a payments page that does not work.
 */
export default async function Settings() {
  const principal = await requireBuyer();
  const [organisation, suppliers] = await Promise.all([
    getOrganisation(principal.organisationId),
    listSuppliers(principal.organisationId),
  ]);

  const live = suppliers.filter((row) => row.status === "live").length;

  return (
    <div style={{ maxWidth: 640 }}>
      <h1 className={shell.title}>{copy.buyer.settingsHeading}</h1>

      <section className={shell.section}>
        <h2 className={shell.sectionTitle}>{copy.buyer.settingsCompanySection}</h2>
        <Card>
          <div className={shell.displayRow}>
            <p className={shell.displayLabel}>{copy.buyer.settingsCompany}</p>
            <p className={shell.displayValue}>{organisation?.legalName}</p>
          </div>
          <div className={shell.displayRow}>
            <p className={shell.displayLabel}>{copy.buyer.fields.tin}</p>
            <p className={shell.displayValue}>
              {organisation?.tin ? maskTin(organisation.tin) : "—"}
            </p>
          </div>
          <div className={shell.displayRow}>
            <p className={shell.displayLabel}>{copy.buyer.settingsSlug}</p>
            <p className={shell.displayValue}>{organisation?.inviteSlug}</p>
          </div>
        </Card>
        <p className={shell.note} style={{ marginTop: "var(--space-3)" }}>
          {copy.buyer.settingsNameNote(BRAND.supportPhone)}
        </p>
      </section>

      <section className={shell.section}>
        <h2 className={shell.sectionTitle}>{copy.buyer.settingsPlanSection}</h2>
        <Card>
          <div className={shell.displayRow}>
            <p className={shell.displayLabel}>{copy.buyer.settingsPlan}</p>
            <p className={shell.displayValue}>{organisation?.plan}</p>
          </div>
          <div className={shell.displayRow}>
            <p className={shell.displayLabel}>{copy.buyer.settingsCap}</p>
            <p className={shell.displayValue}>
              {copy.buyer.settingsCapValue(live, organisation?.activeSupplierCap ?? 0)}
            </p>
          </div>
        </Card>
        <p className={shell.note} style={{ marginTop: "var(--space-3)" }}>
          {copy.buyer.settingsBillingNote}
        </p>
      </section>

      <section className={shell.section}>
        <h2 className={shell.sectionTitle}>{copy.buyer.settingsData}</h2>
        <div style={{ display: "flex", gap: "var(--space-3)" }}>
          <ButtonLink href="/c/invoices/export" variant="secondary" compact>
            {copy.buyer.exportCta}
          </ButtonLink>
          <ButtonLink href="/c/upload" variant="secondary" compact>
            {copy.buyer.settingsReupload}
          </ButtonLink>
        </div>
        <p className={shell.note} style={{ marginTop: "var(--space-3)" }}>
          {copy.buyer.settingsReuploadNote}
        </p>
      </section>

      <form action={signOutBuyer}>
        <Button type="submit" variant="quiet">
          {copy.account.signOut}
        </Button>
      </form>
    </div>
  );
}
