import type { Metadata } from "next";
import { SiteShell } from "@/components/SiteChrome";
import { copy } from "@/lib/copy";
import site from "@/components/site.module.css";

export const metadata: Metadata = {
  title: copy.legal.termsHeading,
  description: copy.legal.terms[0],
};

export default function TermsPage() {
  return (
    <SiteShell>
      <section className={site.section}>
        <h1 className={site.display}>{copy.legal.termsHeading}</h1>
        <div className={site.prose} style={{ marginTop: "var(--space-8)" }}>
          {copy.legal.terms.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
