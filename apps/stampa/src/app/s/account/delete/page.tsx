import { Button } from "@/components/Button";
import { Banner, DocumentCard } from "@/components/Surfaces";
import { Field } from "@/components/Field";
import { copy } from "@/lib/copy";
import { requireSupplier } from "@/lib/auth/require";
import { canDelete } from "@/lib/services/account";
import { deleteAccount } from "../../actions";
import shell from "@/components/shell.module.css";

export const dynamic = "force-dynamic";

/**
 * S15 — Delete account.
 *
 * Two taps and one typed word. No retention offer, no "are you sure you want
 * to lose all your data?", no dark pattern. The supplier walked in with a
 * WhatsApp link and can walk out the same way.
 */
export default async function DeleteAccount({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const principal = await requireSupplier();
  const { error } = await searchParams;
  const check = await canDelete(principal.supplierId);

  return (
    <div className={shell.stack}>
      <h1 className={shell.title}>{copy.account.deleteHeading}</h1>

      {!check.allowed ? <Banner tone="warning">{copy.account.deleteBlocked}</Banner> : null}

      <DocumentCard label={copy.account.deleteCardLabel}>
        <p className={shell.lede}>{copy.account.deleteBody}</p>
        <p className={shell.note} style={{ marginTop: "var(--space-4)" }}>
          {copy.account.deleteLaw}
        </p>
      </DocumentCard>

      <p>
        <a href="/s/account/export">{copy.account.deleteFirst}</a>
      </p>

      <form action={deleteAccount}>
        <Field
          name="confirm"
          label={copy.account.deleteConfirmLabel}
          autoComplete="off"
          error={error === "confirm" ? "Type DELETE exactly." : undefined}
          required
        />
        {check.allowed ? (
          <Button type="submit" variant="destructive" block>
            {copy.account.deleteCta}
          </Button>
        ) : (
          <Button
            type="submit"
            variant="destructive"
            block
            disabled
            disabledReason={copy.account.deleteBlocked}
          >
            {copy.account.deleteCta}
          </Button>
        )}
      </form>
    </div>
  );
}
