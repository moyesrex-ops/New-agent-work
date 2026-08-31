"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { copy } from "@/lib/copy";
import shell from "./shell.module.css";
import styles from "./sending.module.css";

const SLOW_AFTER_MS = 60_000;
const POLL_MS = 2_500;

/**
 * S8 — Sending.
 *
 * The most under-designed screen in most products and one of the most
 * important here. Three commitments, all visible:
 *   - an honest estimate, and when it stops being true, the copy changes and
 *     the bar goes indeterminate rather than faking 99%;
 *   - explicit permission to leave, because the transmission is server-side
 *     and finishing it does not depend on this tab staying open;
 *   - the run action is idempotent, so this component retrying is free.
 */
export function Sending({
  invoiceId,
  run,
}: {
  invoiceId: string;
  run: (invoiceId: string) => Promise<void>;
}) {
  const router = useRouter();
  const [elapsed, setElapsed] = useState(0);
  const slow = elapsed >= SLOW_AFTER_MS;

  useEffect(() => {
    const started = Date.now();
    const tick = setInterval(() => setElapsed(Date.now() - started), 1000);

    let cancelled = false;
    const attempt = async () => {
      if (cancelled) return;
      try {
        await run(invoiceId);
      } catch {
        // A failed poll is not a user-facing event: the server keeps the job
        // either way and the next tick tries again.
      }
      if (!cancelled) router.refresh();
    };

    void attempt();
    const poll = setInterval(attempt, POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(tick);
      clearInterval(poll);
    };
  }, [invoiceId, run, router]);

  return (
    <div className={shell.stack} aria-live="polite">
      <h1 className={shell.title}>{slow ? copy.sending.slowHeading : copy.sending.heading}</h1>

      <div
        className={styles.track}
        role="progressbar"
        aria-label={copy.sending.heading}
        {...(slow ? {} : { "aria-valuemin": 0, "aria-valuemax": 100 })}
      >
        <div className={slow ? styles.indeterminate : styles.determinate} />
      </div>

      <p className={shell.lede}>{slow ? copy.sending.slowBody : copy.sending.estimate}</p>
      <p className={shell.note}>{copy.sending.permission}</p>
    </div>
  );
}
