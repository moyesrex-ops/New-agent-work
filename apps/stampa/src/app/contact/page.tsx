import type { Metadata } from "next";
import { Button, ButtonLink } from "@/components/Button";
import { Field, TextAreaField } from "@/components/Field";
import { Banner } from "@/components/Surfaces";
import { SiteShell } from "@/components/SiteChrome";
import { BRAND, copy } from "@/lib/copy";
import site from "@/components/site.module.css";
import { sendContact } from "./actions";

export const metadata: Metadata = {
  title: copy.contact.heading,
  description: copy.contact.lede,
};

const ERRORS: Record<string, string> = {
  empty: copy.contact.empty,
  failed: copy.contact.failed,
  too_many: copy.contact.tooMany,
};

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const { sent, error } = await searchParams;

  return (
    <SiteShell>
      <section className={site.section}>
        <h1 className={site.display}>{copy.contact.heading}</h1>
        <p className={site.lede}>{copy.contact.lede}</p>

        <div className={`${site.contactGrid} ${site.stackStart}`}>
          <article className={site.contactCard}>
            <p className={site.kicker}>{copy.contact.phoneLabel}</p>
            <p className={site.contactValue}>
              <a href={`tel:${BRAND.supportPhoneTel}`}>{BRAND.supportPhone}</a>
            </p>
            <p className={site.contactNote}>{BRAND.supportHours}</p>
            <div className={site.ctaRow}>
              <ButtonLink href={`tel:${BRAND.supportPhoneTel}`}>{copy.callUs(BRAND.supportPhone)}</ButtonLink>
              <ButtonLink href={BRAND.supportWhatsApp} variant="secondary" target="_blank" rel="noreferrer">
                {copy.help.whatsapp}
              </ButtonLink>
            </div>
            <p className={site.contactMail}>
              <a href={`mailto:${BRAND.supportEmail}`}>{BRAND.supportEmail}</a>
            </p>
          </article>

          <article className={site.contactCard}>
            <h2 className={site.stepTitle}>{copy.contact.formHeading}</h2>
            {sent ? (
              <div className={site.formStack}>
                <Banner tone="neutral">{copy.contact.sent}</Banner>
              </div>
            ) : (
              <form action={sendContact} className={site.formStack}>
                <p className={site.honeypot} aria-hidden="true">
                  <label>
                    company
                    <input name="company" tabIndex={-1} autoComplete="off" />
                  </label>
                </p>
                <Field name="name" label={copy.contact.name} autoComplete="name" />
                <Field
                  name="email"
                  label={copy.contact.email}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  autoCapitalize="none"
                />
                <TextAreaField
                  name="message"
                  label={copy.contact.message}
                  rows={6}
                  error={error ? ERRORS[error] : undefined}
                />
                <Button type="submit" block>
                  {copy.contact.cta}
                </Button>
              </form>
            )}
          </article>
        </div>
      </section>
    </SiteShell>
  );
}
