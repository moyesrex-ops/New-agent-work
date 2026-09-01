import type { Metadata } from "next";
import { ButtonLink } from "@/components/Button";
import { Mark } from "@/components/Logo";
import { SiteShell } from "@/components/SiteChrome";
import { TRUST, copy } from "@/lib/copy";
import site from "@/components/site.module.css";

export const metadata: Metadata = {
  title: copy.site.title,
  description: copy.site.description,
  robots: { index: true, follow: true },
};

export default function Home() {
  const preview = copy.faq.items.slice(0, 5);

  return (
    <SiteShell>
      <section className={site.hero}>
        <span className={site.heroMark} aria-hidden="true">
          <Mark size={280} />
        </span>
        <p className={site.kicker}>{copy.site.heroKicker}</p>
        <h1 className={site.display}>{copy.site.heroHeading}</h1>
        <p className={site.lede}>{copy.site.heroLede}</p>
        <div className={site.ctaRow}>
          <ButtonLink href="/s/start">{copy.site.heroSupplier}</ButtonLink>
          <ButtonLink href="/c/signin" variant="secondary">
            {copy.site.heroBuyer}
          </ButtonLink>
        </div>
        <p className={site.free}>{TRUST.free}</p>
      </section>

      <section className={site.section} id="how">
        <h2 className={site.sectionTitle}>{copy.site.howHeading}</h2>
        <div className={site.steps}>
          <article className={site.step}>
            <p className={site.stepIndex}>01</p>
            <h3 className={site.stepTitle}>{copy.site.how1Title}</h3>
            <p className={site.stepBody}>{copy.site.how1Body}</p>
          </article>
          <article className={site.step}>
            <p className={site.stepIndex}>02</p>
            <h3 className={site.stepTitle}>{copy.site.how2Title}</h3>
            <p className={site.stepBody}>{copy.site.how2Body}</p>
          </article>
          <article className={site.step}>
            <p className={site.stepIndex}>03</p>
            <h3 className={site.stepTitle}>{copy.site.how3Title}</h3>
            <p className={site.stepBody}>{copy.site.how3Body}</p>
          </article>
        </div>
      </section>

      <section className={site.trust}>
        <div className={site.section}>
          <h2 className={site.sectionTitle}>{copy.site.trustHeading}</h2>
          <div className={site.trustList}>
            <p className={site.trustItem}>{TRUST.free}</p>
            <p className={site.trustItem}>{TRUST.notOurNumber}</p>
            <p className={site.trustItem}>{TRUST.antiScam}</p>
          </div>
        </div>
      </section>

      <section className={site.section} id="price">
        <h2 className={site.sectionTitle}>{copy.site.priceHeading}</h2>
        <div className={site.priceGrid}>
          <article className={site.priceCard}>
            <strong>{copy.site.priceBuyerTitle}</strong>
            <p>{copy.site.priceBuyerBody}</p>
          </article>
          <article className={site.priceCard}>
            <strong>{copy.site.priceSupplierTitle}</strong>
            <p>{copy.site.priceSupplierBody}</p>
          </article>
        </div>
      </section>

      <section className={site.section} id="faq">
        <h2 className={site.sectionTitle}>{copy.site.faqHeading}</h2>
        <div className={site.faqList}>
          {preview.map((item) => (
            <details key={item.q}>
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
        <a className={site.more} href="/faq">
          {copy.site.faqMore}
        </a>
      </section>
    </SiteShell>
  );
}
