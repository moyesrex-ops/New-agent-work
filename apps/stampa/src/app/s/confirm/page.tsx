import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Lock } from "lucide-react";
import { Button } from "@/components/Button";
import { Field } from "@/components/Field";
import { DocumentCard } from "@/components/Surfaces";
import { copy, BRAND } from "@/lib/copy";
import { openInvite } from "@/lib/services/onboarding";
import { requireSupplier } from "@/lib/auth/require";
import { confirmDetails } from "../actions";
import shell from "@/components/shell.module.css";

export const dynamic = "force-dynamic";

/**
 * S4 — Confirm business. The single strongest trust move in the product.
 *
 * We show what we already know. A scam asks; a legitimate system already has
 * it. Rendered as a DocumentCard rather than a form, because the user is
 * confirming a record, not filling one in.
 */
export default async function ConfirmBusiness({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireSupplier();
  const { error } = await searchParams;

  const store = await cookies();
  const inviteCode = store.get("stampa_invite")?.value;
  const invite = inviteCode ? await openInvite(inviteCode) : null;
  if (!invite || invite.state !== "open") redirect("/s");

  return (
    <div className={shell.stack}>
      <h1 className={shell.title}>{copy.confirm.heading}</h1>
      <p className={shell.lede}>{copy.confirm.source(invite.buyerName)}</p>

      <form action={confirmDetails}>
        <DocumentCard label={copy.confirm.cardLabel}>
          <Field
            name="businessName"
            label={copy.confirm.businessName}
            defaultValue={invite.supplierName}
            error={error === "businessName" ? "Enter your business name." : undefined}
            required
          />
          <Field
            name="tin"
            label={copy.confirm.tin}
            defaultValue={invite.tin ?? ""}
            inputMode="numeric"
            hint={invite.tin ? undefined : copy.confirm.missingTin}
            error={error === "tin" ? "Enter your TIN." : undefined}
            required
          />
          <Field
            name="address"
            label={copy.confirm.address}
            defaultValue={invite.address}
          />

          {/* Read-only, locked, with the reason stated in place — not in a
              tooltip. Trust script, mechanism 5. */}
          <div className={shell.lockedRow}>
            <span className={shell.displayLabel}>{copy.confirm.paidInto}</span>
            <span className={shell.lockLine}>
              <Lock size={16} strokeWidth={1.75} aria-hidden="true" />
              <span className={shell.displayValue}>
                {invite.bankName ?? "Not provided"}
                {invite.bankLast4 ? ` ••••${invite.bankLast4}` : ""}
              </span>
            </span>
          </div>
          <p className={shell.note} style={{ marginTop: "var(--space-2)" }}>
            {copy.confirm.bankLocked}
          </p>
        </DocumentCard>

        <div className={shell.actionBar}>
          <Button type="submit" block>
            {copy.confirm.cta}
          </Button>
        </div>
      </form>

      <p className={shell.note}>
        {copy.confirm.wrong}? Call {BRAND.supportPhone}.
      </p>
    </div>
  );
}
