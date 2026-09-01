import type { Metadata } from "next";
import { SiteShell } from "@/components/SiteChrome";
import { copy } from "@/lib/copy";
import site from "@/components/site.module.css";

export const metadata: Metadata = {
  title: copy.faq.heading,
  description: copy.faq.lede,
};

export default function FaqPage() {
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: copy.faq.items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <SiteShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <section className={site.section}>
        <h1 className={site.display}>{copy.faq.heading}</h1>
        <p className={site.lede}>{copy.faq.lede}</p>
        <div className={`${site.faqList} ${site.stackStart}`}>
          {copy.faq.items.map((item, index) => (
            <details key={item.q} open={index === 0}>
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
