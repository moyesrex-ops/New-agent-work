import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/Button";
import { OtpChannelActions } from "@/components/OtpChannelActions";
import { OtpField } from "@/components/Field";
import { copy } from "@/lib/copy";
import { getDb } from "@/lib/db/client";
import { latestOtpAt, otpChannelWait } from "@/lib/auth/otp";
import { formatPhone, parsePhone } from "@/lib/phone";
import { checkCode, resendCode, sendVoiceCode } from "../actions";
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
  searchParams: Promise<{ error?: string; voice?: string }>;
}) {
  const { error, voice } = await searchParams;
  const store = await cookies();
  const parsed = parsePhone(store.get("stampa_pending_phone")?.value ?? "");
  if (!parsed.ok) redirect("/s/start");

  const db = await getDb();
  const wait = otpChannelWait(await latestOtpAt(db, parsed.value));

  return (
    <div className={shell.stack}>
      <h1 className={shell.title}>{copy.otp.heading}</h1>
      <p className={shell.lede}>
        {voice ? copy.otp.voiceSent : copy.otp.sentTo(formatPhone(parsed.value))}{" "}
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

      <OtpChannelActions
        resendAfterMs={wait.resendAfterMs}
        voiceAfterMs={wait.voiceAfterMs}
        resend={resendCode}
        voice={sendVoiceCode}
      />
    </div>
  );
}
