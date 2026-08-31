import { cookies } from "next/headers";
import { Button } from "@/components/Button";
import { Field } from "@/components/Field";
import { copy } from "@/lib/copy";
import { openInvite } from "@/lib/services/onboarding";
import { formatPhone } from "@/lib/phone";
import { sendCode } from "../actions";
import shell from "@/components/shell.module.css";

export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = copy.phone.errors;

/** S2 — Phone entry. Two fields stand between suspicion and a first invoice. */
export default async function PhoneEntry({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const store = await cookies();
  const inviteCode = store.get("stampa_invite")?.value;
  const invite = inviteCode ? await openInvite(inviteCode) : null;
  const prefill = invite?.state === "open" ? formatPhone(invite.supplierPhone) : "";

  return (
    <div className={shell.stack}>
      <h1 className={shell.title}>{copy.phone.heading}</h1>
      <p className={shell.lede}>{copy.phone.hint}</p>

      <form action={sendCode}>
        <Field
          name="phone"
          label={copy.phone.label}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          defaultValue={prefill}
          placeholder={copy.phone.placeholder}
          error={error ? (ERRORS[error] ?? copy.errors.generic) : undefined}
          hint={copy.phone.privacy}
          required
        />
        <div className={shell.actionBar}>
          <Button type="submit" block>
            {copy.phone.cta}
          </Button>
        </div>
      </form>

      {/* Trust script, mechanism 3: nothing here that a scam would ask for. */}
      <p className={shell.free}>{copy.invite.free}</p>
    </div>
  );
}
