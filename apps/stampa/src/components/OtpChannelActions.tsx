"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { copy } from "@/lib/copy";
import shell from "@/components/shell.module.css";

/**
 * Resend and voice must not exist in the HTML until the wait is over.
 * A disabled button still submits without JavaScript.
 */
export function OtpChannelActions({
  resendAfterMs,
  voiceAfterMs,
  resend,
  voice,
}: {
  resendAfterMs: number;
  voiceAfterMs: number;
  resend: () => Promise<void>;
  voice: () => Promise<void>;
}) {
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    if (resendAfterMs <= 0 && voiceAfterMs <= 0) return undefined;
    const started = Date.now();
    const id = window.setInterval(() => setElapsedMs(Date.now() - started), 500);
    return () => window.clearInterval(id);
  }, [resendAfterMs, voiceAfterMs]);

  const resendLeft = Math.max(0, Math.ceil((resendAfterMs - elapsedMs) / 1000));
  const voiceLeft = Math.max(0, Math.ceil((voiceAfterMs - elapsedMs) / 1000));

  return (
    <>
      <p className={shell.note}>{copy.otp.resendPrompt}</p>
      <div className={shell.row}>
        {resendLeft > 0 ? (
          <p className={shell.note}>{copy.otp.resendIn(resendLeft)}</p>
        ) : (
          <form action={resend}>
            <Button type="submit" variant="quiet">
              {copy.otp.resend}
            </Button>
          </form>
        )}
        {voiceLeft > 0 ? (
          <p className={shell.note}>{copy.otp.voiceIn(voiceLeft)}</p>
        ) : (
          <form action={voice}>
            <Button type="submit" variant="quiet">
              {copy.otp.voice}
            </Button>
          </form>
        )}
      </div>
    </>
  );
}
