import { Button, ButtonLink } from "@/components/Button";
import { Banner, Card, DocumentCard, EmptyState } from "@/components/Surfaces";
import { requireBuyer } from "@/lib/auth/require";
import { copy } from "@/lib/copy";
import { formatPhone } from "@/lib/phone";
import { getOrganisation, listSuppliers } from "@/lib/services/buyer";
import { inviteSuppliers } from "../actions";
import shell from "@/components/shell.module.css";

export const dynamic = "force-dynamic";

/**
 * B8 Invite composer.
 *
 * The message goes out in the buyer's name, and the preview shows it exactly
 * as the supplier will receive it — because the buyer is lending us their
 * authority and is entitled to read the sentence before it is sent. The
 * message is not editable in v1: it carries the anti-scam promise and the
 * ninety-second claim, and both have to hold on every send.
 */
export default async function InviteComposer({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const principal = await requireBuyer();
  const { error } = await searchParams;

  const [organisation, suppliers] = await Promise.all([
    getOrganisation(principal.organisationId),
    listSuppliers(principal.organisationId),
  ]);

  const invitable = suppliers.filter((row) => row.status !== "live" && row.status !== "deleted");

  if (!invitable.length) {
    return (
      <EmptyState
        heading={suppliers.length ? copy.buyer.inviteAllLive : copy.buyer.suppliersEmpty}
        body={suppliers.length ? undefined : copy.buyer.inviteUploadFirst}
        action={
          <ButtonLink href={suppliers.length ? "/c/suppliers" : "/c/upload"}>
            {suppliers.length ? copy.buyer.suppliersHeading : copy.buyer.uploadCta}
          </ButtonLink>
        }
      />
    );
  }

  const preview = copy.buyer.inviteMessage(
    organisation?.legalName ?? copy.buyer.yourCompany,
    `stampa.ng/s/${organisation?.inviteSlug ?? "ABC"}-4471`,
  );

  return (
    <div style={{ maxWidth: 720 }}>
      <h1 className={shell.title}>{copy.buyer.inviteHeading(invitable.length)}</h1>
      <p className={shell.lede} style={{ marginBottom: "var(--space-5)" }}>
        {copy.buyer.inviteBody(organisation?.legalName ?? copy.buyer.yourCompanyLower)}
      </p>

      {error === "none_selected" ? (
        <div style={{ marginBottom: "var(--space-5)" }}>
          <Banner tone="danger">{copy.buyer.inviteNoneSelected}</Banner>
        </div>
      ) : null}

      <DocumentCard label={copy.buyer.invitePreviewLabel}>
        <p className={shell.note}>{copy.buyer.invitePreview}</p>
        <p style={{ marginTop: "var(--space-2)" }}>{preview}</p>
      </DocumentCard>

      <form action={inviteSuppliers} style={{ marginTop: "var(--space-6)" }}>
        <Card>
          <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
            <legend className={shell.sectionTitle}>{copy.buyer.inviteWho}</legend>
            <ul className={shell.stackTight}>
              {invitable.map((row) => (
                <li key={row.linkId}>
                  <label className={shell.checkRow}>
                    <input type="checkbox" name="linkId" value={row.linkId} defaultChecked />
                    <span>
                      {row.businessName}
                      <span className={shell.note}> · {formatPhone(row.phone)}</span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </fieldset>
        </Card>

        <div style={{ marginTop: "var(--space-5)", display: "flex", gap: "var(--space-3)" }}>
          <Button type="submit">{copy.buyer.inviteCta}</Button>
          <ButtonLink href="/c/suppliers" variant="secondary">
            {copy.buyer.inviteCancel}
          </ButtonLink>
        </div>
        <p className={shell.note} style={{ marginTop: "var(--space-3)" }}>
          {copy.buyer.inviteChannels}
        </p>
      </form>
    </div>
  );
}
