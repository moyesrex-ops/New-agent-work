import { ButtonLink } from "@/components/Button";
import { Card } from "@/components/Surfaces";
import { copy, BRAND, TRUST } from "@/lib/copy";
import shell from "@/components/shell.module.css";

export const dynamic = "force-dynamic";

/** Support hours are 8am-8pm WAT (UTC+1). Read at request time, not at build. */
async function supportIsOpen(): Promise<boolean> {
  const hour = new Date(Date.now() + 60 * 60 * 1000).getUTCHours();
  return hour >= 8 && hour < 20;
}

/** S13 — Help. A number a human answers, FAQs, and the anti-scam line again. */
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
        <div className={shell.buttonStack} style={{ marginTop: "var(--space-4)" }}>
          <ButtonLink href={`tel:${BRAND.supportPhoneTel}`} block>
            {copy.callUs(BRAND.supportPhone)}
          </ButtonLink>
          <ButtonLink
            href={BRAND.supportWhatsApp}
            variant="secondary"
            block
            target="_blank"
            rel="noreferrer"
          >
            {copy.help.whatsapp}
          </ButtonLink>
          <ButtonLink href={`mailto:${BRAND.supportEmail}`} variant="quiet" block>
            {copy.help.email}
          </ButtonLink>
        </div>
      </Card>

      <Card>
        <p className={shell.free}>{copy.help.freeHeading}</p>
        <p className={shell.note} style={{ marginTop: "var(--space-2)" }}>
          {TRUST.antiScam}
        </p>
      </Card>

      <Card>
        <h2 className={shell.sectionTitle}>{copy.help.installHeading}</h2>
        <p className={shell.note}>{copy.help.installBody}</p>
      </Card>

      <div className={shell.stack}>
        <h2 className={shell.sectionTitle}>{copy.help.faqHeading}</h2>
        {copy.faq.items.map((item) => (
          <Card key={item.q}>
            <p style={{ fontWeight: "var(--font-weight-semibold)" }}>{item.q}</p>
            <p className={shell.note} style={{ marginTop: "var(--space-2)" }}>
              {item.a}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
