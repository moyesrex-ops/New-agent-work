import { cookies } from "next/headers";
import Link from "next/link";
import { Button } from "@/components/Button";
import { OtpField } from "@/components/Field";
import { copy, BRAND } from "@/lib/copy";
import { formatPhone } from "@/lib/phone";
import { checkCode, resendCode } from "../actions";
import shell from "@/components/shell.module.css";

export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  ...copy.otp.errors,
  rate_limited: copy.phone.errors.rate_limited,
};

/** S3 — OTP. */
export default async function CodeEntry({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const store = await cookies();
  const phone = store.get("stampa_pending_phone")?.value ?? "";

  return (
    <div className={shell.stack}>
      <h1 className={shell.title}>{copy.otp.heading}</h1>
      <p className={shell.lede}>
        {copy.otp.sentTo(formatPhone(phone))}{" "}
        <Link href="/s/start">{copy.otp.change}</Link>
      </p>

      <form action={checkCode}>
        <OtpField
          name="code"
          label={copy.otp.label}
          autoFocus
          required
          error={error ? (ERRORS[error] ?? copy.errors.generic) : undefined}
        />
        <div className={shell.actionBar}>
          <Button type="submit" block>
            {copy.otp.cta}
          </Button>
        </div>
      </form>

      <p className={shell.note}>{copy.otp.resendPrompt}</p>
      <div className={shell.row}>
        <form action={resendCode}>
          <Button type="submit" variant="quiet">
            {copy.otp.resend}
          </Button>
        </form>
        {/* Voice fallback at 60s is ticket A-02; the number is answered by a
            human either way, which is the part that matters at this step.
            Sized as a tap target, not a footnote — the supplier reaching for
            it is the one the SMS never arrived for. */}
        <a href={`tel:${BRAND.supportPhone}`} className={shell.headerLink}>
          {copy.otp.voice}
        </a>
      </div>
    </div>
  );
}
