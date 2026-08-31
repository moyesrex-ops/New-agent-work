import { Card } from "@/components/Surfaces";
import { copy, BRAND, TRUST } from "@/lib/copy";
import shell from "@/components/shell.module.css";

export const dynamic = "force-dynamic";

/** Support hours are 8am-8pm WAT (UTC+1). Read at request time, not at build. */
async function supportIsOpen(): Promise<boolean> {
  const hour = new Date(Date.now() + 60 * 60 * 1000).getUTCHours();
  return hour >= 8 && hour < 20;
}

/** S13 — Help. A number a human answers, and the anti-scam line again. */
export default async function Help() {
  const open = await supportIsOpen();

  return (
    <div className={shell.stack}>
      <h1 className={shell.title}>{copy.help.heading}</h1>

      <Card>
        <p className={shell.lede}>{copy.help.call(BRAND.supportPhone, BRAND.supportHours)}</p>
        <p className={shell.note} style={{ marginTop: "var(--space-2)" }}>
          {open ? copy.help.reply : copy.help.closed}
        </p>
        <p style={{ marginTop: "var(--space-4)" }}>
          <a href={`tel:${BRAND.supportPhone}`}>Call {BRAND.supportPhone}</a>
        </p>
        <p style={{ marginTop: "var(--space-2)" }}>
          <a href="https://wa.me/2347000782672" target="_blank" rel="noreferrer">
            {copy.help.whatsapp}
          </a>
        </p>
      </Card>

      {/* Mechanism 9. Repeated here and on first open, monthly thereafter. */}
      <Card>
        <p className={shell.free}>{copy.help.freeHeading}</p>
        <p className={shell.note} style={{ marginTop: "var(--space-2)" }}>
          {TRUST.antiScam}
        </p>
      </Card>
    </div>
  );
}
