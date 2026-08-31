"use client";

import { useState } from "react";
import { Button } from "./Button";
import { copy } from "@/lib/copy";
import shell from "./shell.module.css";

/**
 * The forwarding loop. WhatsApp first because that is where the market lives,
 * with SMS, copy and download behind it — a supplier without WhatsApp still
 * has to be able to send their customer the proof (Flow 1 failure table).
 */
export function ShareStamp({
  text,
  pdfHref,
  onShared,
}: {
  text: string;
  pdfHref: string;
  onShared: () => Promise<void>;
}) {
  const [state, setState] = useState<"idle" | "shared" | "copied">("idle");

  const record = () => {
    void onShared();
  };

  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(text)}`;
  const smsHref = `sms:?&body=${encodeURIComponent(text)}`;

  return (
    <div className={shell.stack}>
      <a
        href={whatsappHref}
        target="_blank"
        rel="noreferrer"
        onClick={() => {
          record();
          setState("shared");
        }}
        style={{ textDecoration: "none" }}
      >
        <Button type="button" block>
          {copy.stamped.share}
        </Button>
      </a>

      {state === "shared" ? <p className={shell.free}>{copy.stamped.shared}</p> : null}

      <div className={shell.row}>
        <a href={pdfHref} className={shell.note} download>
          {copy.stamped.download}
        </a>
        <a href={smsHref} className={shell.note} onClick={record}>
          Send by SMS
        </a>
        <button
          type="button"
          className={shell.note}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(text);
              setState("copied");
              record();
            } catch {
              setState("idle");
            }
          }}
        >
          {state === "copied" ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}
