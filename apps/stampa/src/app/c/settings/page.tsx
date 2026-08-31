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
      <h1 className={shell.title}>Settings</h1>

      <section className={shell.section}>
        <h2 className={shell.sectionTitle}>Company</h2>
        <Card>
          <div className={shell.displayRow}>
            <p className={shell.displayLabel}>Registered name</p>
            <p className={shell.displayValue}>{organisation?.legalName}</p>
          </div>
          <div className={shell.displayRow}>
            <p className={shell.displayLabel}>TIN</p>
            <p className={shell.displayValue}>
              {organisation?.tin ? maskTin(organisation.tin) : "—"}
            </p>
          </div>
          <div className={shell.displayRow}>
            <p className={shell.displayLabel}>Invite code prefix</p>
            <p className={shell.displayValue}>{organisation?.inviteSlug}</p>
          </div>
        </Card>
        <p className={shell.note} style={{ marginTop: "var(--space-3)" }}>
          Your registered name appears at the top of every invitation your suppliers receive.
          Call {BRAND.supportPhone} to change it — we verify it against your CAC record first,
          because a supplier deciding whether to trust a link is reading that line.
        </p>
      </section>

      <section className={shell.section}>
        <h2 className={shell.sectionTitle}>Plan</h2>
        <Card>
          <div className={shell.displayRow}>
            <p className={shell.displayLabel}>Plan</p>
            <p className={shell.displayValue}>{organisation?.plan}</p>
          </div>
          <div className={shell.displayRow}>
            <p className={shell.displayLabel}>Active suppliers</p>
            <p className={shell.displayValue}>
              {live} of {organisation?.activeSupplierCap}
            </p>
          </div>
        </Card>
        <p className={shell.note} style={{ marginTop: "var(--space-3)" }}>
          We invoice you by email and you pay by bank transfer. There is no card on file and the
          product never takes one. Suppliers are never charged anything.
        </p>
      </section>

      <section className={shell.section}>
        <h2 className={shell.sectionTitle}>Your data</h2>
        <div style={{ display: "flex", gap: "var(--space-3)" }}>
          <ButtonLink href="/c/invoices/export" variant="secondary" compact>
            {copy.buyer.exportCta}
          </ButtonLink>
          <ButtonLink href="/c/upload" variant="secondary" compact>
            Re-upload vendor master
          </ButtonLink>
        </div>
        <p className={shell.note} style={{ marginTop: "var(--space-3)" }}>
          Re-uploading updates bank details and is the only way they change. Every change is
          recorded with who did it and when.
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
