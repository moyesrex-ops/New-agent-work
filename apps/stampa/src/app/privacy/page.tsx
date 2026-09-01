import type { Metadata } from "next";
import { SiteShell } from "@/components/SiteChrome";
import { copy } from "@/lib/copy";
import site from "@/components/site.module.css";

export const metadata: Metadata = {
  title: copy.legal.privacyHeading,
  description: copy.legal.privacy[0],
};

export default function PrivacyPage() {
  return (
    <SiteShell>
      <section className={site.section}>
        <h1 className={site.display}>{copy.legal.privacyHeading}</h1>
        <div className={`${site.prose} ${site.stackStart}`}>
          {copy.legal.privacy.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
