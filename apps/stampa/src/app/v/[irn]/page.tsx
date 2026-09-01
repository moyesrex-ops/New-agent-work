import type { Metadata } from "next";
import { ButtonLink } from "@/components/Button";
import { SiteShell } from "@/components/SiteChrome";
import { nrsPortalUrl } from "@/lib/nrs";
import { copy } from "@/lib/copy";
import site from "@/components/site.module.css";

export const metadata: Metadata = {
  title: copy.site.verifyHeading,
  robots: { index: false, follow: false },
};

export default async function VerifyPage({ params }: { params: Promise<{ irn: string }> }) {
  const { irn } = await params;
  const decoded = decodeURIComponent(irn);
  const href = nrsPortalUrl();

  return (
    <SiteShell>
      <section className={site.section}>
        <h1 className={site.display}>{copy.site.verifyHeading}</h1>
        <p className={site.lede}>{copy.site.verifyBody(decoded)}</p>
        <p className={site.irn}>{decoded}</p>
        <ButtonLink href={href} target="_blank" rel="noreferrer">
          {copy.site.verifyCta}
        </ButtonLink>
      </section>
    </SiteShell>
  );
}
