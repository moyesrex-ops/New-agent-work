"use client";

import { BRAND, copy } from "@/lib/copy";
import "./globals.css";

/**
 * The last boundary. This one replaces the root layout, so it renders its own
 * <html> and <body> and cannot rely on anything the layout sets up — including
 * the webfonts, which is why the type here falls back to the system stack.
 *
 * Without this file a crash in the root layout shows Next's own grey
 * "Application error: a client-side exception has occurred", which is the
 * exact opposite of the promise this product makes to somebody who has just
 * sent an invoice and wants to know whether their money is safe.
 */
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en-NG">
      <body
        style={{
          fontFamily: "system-ui, 'Segoe UI', Roboto, sans-serif",
          background: "var(--color-paper, #FBF9F4)",
          color: "var(--color-ink-900, #14121A)",
          margin: 0,
          padding: "3rem 1.25rem",
        }}
      >
        <main style={{ maxWidth: "32rem", margin: "0 auto" }}>
          <h1 style={{ fontSize: "1.5rem", lineHeight: 1.25, margin: 0 }}>
            {copy.errors.serverHeading}
          </h1>
          <p style={{ fontSize: "1.125rem", lineHeight: 1.45, marginTop: "0.75rem" }}>
            {copy.errors.serverBody}
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "1.5rem",
              minHeight: "3rem",
              padding: "0 1.25rem",
              fontSize: "1rem",
              fontFamily: "inherit",
              color: "#FFFFFF",
              background: "var(--color-stamp-700, #4C2A85)",
              border: "none",
              borderRadius: "0.5rem",
              cursor: "pointer",
            }}
          >
            {copy.errors.serverCta}
          </button>
          <p style={{ marginTop: "1rem", fontSize: "0.875rem" }}>{BRAND.supportPhone}</p>
        </main>
      </body>
    </html>
  );
}
