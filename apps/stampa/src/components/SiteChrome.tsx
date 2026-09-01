import Link from "next/link";
import { Wordmark } from "@/components/Logo";
import { BRAND, copy } from "@/lib/copy";
import site from "@/components/site.module.css";

export function SiteHeader() {
  return (
    <header className={site.header}>
      <Link href="/" aria-label={copy.a11y.siteHome} className={site.brand}>
        <Wordmark size={28} />
      </Link>
      <nav className={site.nav} aria-label={BRAND.name}>
        <Link href="/#how">{copy.site.navHow}</Link>
        <Link href="/faq">{copy.site.navFaq}</Link>
        <Link href="/contact">{copy.site.navContact}</Link>
        <Link href="/s/start">{copy.site.navSupplier}</Link>
        <Link href="/c/signin">{copy.site.navBuyer}</Link>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className={site.footer}>
      <p>
        {copy.site.footerLegal} · {BRAND.supportHours}
      </p>
      <p className={site.footerLinks}>
        <a href={`tel:${BRAND.supportPhoneTel}`}>{BRAND.supportPhone}</a>
        <a href={BRAND.supportWhatsApp} rel="noreferrer" target="_blank">
          {copy.contact.whatsappLabel}
        </a>
        <a href={`mailto:${BRAND.supportEmail}`}>{BRAND.supportEmail}</a>
        <Link href="/privacy">{copy.site.navPrivacy}</Link>
        <Link href="/terms">{copy.site.navTerms}</Link>
        <Link href="/faq">{copy.site.navFaq}</Link>
      </p>
    </footer>
  );
}

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className={site.page}>
      <SiteHeader />
      <main className={site.main}>{children}</main>
      <SiteFooter />
    </div>
  );
}
