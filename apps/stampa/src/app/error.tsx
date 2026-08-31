"use client";

import { Button } from "@/components/Button";
import { copy, BRAND } from "@/lib/copy";
import shell from "@/components/shell.module.css";

/**
 * Never a stack trace and never "Application error". The user is told whose
 * fault it is (ours), that nothing is lost, and what to do next.
 */
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className={shell.supplier} style={{ paddingTop: "var(--space-12)" }}>
      <h1 className={shell.title}>{copy.errors.serverHeading}</h1>
      <p className={shell.lede} style={{ marginTop: "var(--space-3)" }}>
        {copy.errors.serverBody}
      </p>
      <div style={{ marginTop: "var(--space-6)" }}>
        <Button type="button" onClick={reset}>
          {copy.errors.serverCta}
        </Button>
      </div>
      <p className={shell.note} style={{ marginTop: "var(--space-4)" }}>
        {BRAND.supportPhone}
      </p>
    </div>
  );
}
