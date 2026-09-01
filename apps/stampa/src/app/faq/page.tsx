import type { Metadata } from "next";
import { SiteShell } from "@/components/SiteChrome";
import { copy } from "@/lib/copy";
import site from "@/components/site.module.css";

export const metadata: Metadata = {
  title: copy.faq.heading,
  description: copy.faq.lede,
};

export default function FaqPage() {
  return (
    <SiteShell>
      <section className={site.section}>
        <h1 className={site.display}>{copy.faq.heading}</h1>
        <p className={site.lede}>{copy.faq.lede}</p>
        <div className={site.faqList} style={{ marginTop: "var(--space-8)" }}>
          {copy.faq.items.map((item) => (
            <details key={item.q} open>
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
