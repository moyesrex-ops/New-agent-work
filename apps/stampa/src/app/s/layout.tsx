import Link from "next/link";
import { Wordmark } from "@/components/Logo";
import { OfflineBanner } from "@/components/OfflineBanner";
import { DemoBanner } from "@/components/DemoBanner";
import { BRAND, copy } from "@/lib/copy";
import shell from "@/components/shell.module.css";

/**
 * Supplier shell. No hamburger, no tab bar, no nav drawer — four routes and a
 * help link. Phase 15.4 names a hamburger dumping ground as a cheap tell, and
 * the way to avoid one is to not have enough screens to need it.
 */
export default function SupplierLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={shell.page}>
      <DemoBanner />
      <OfflineBanner />
      <div className={shell.supplier}>
          <header className={shell.header}>
            <Link href="/s" aria-label={copy.a11y.supplierHome} className={shell.headerHome}>
              <Wordmark size={26} />
            </Link>
            <span className={shell.headerSpacer} />
            <Link href="/s/help" className={shell.textLink}>
              {copy.nav.help}
            </Link>
          </header>
        <main className={shell.main}>{children}</main>
        <footer className={shell.note} style={{ paddingBottom: "var(--space-6)" }}>
          {BRAND.name} · {BRAND.supportPhone} · {BRAND.supportHours}
        </footer>
      </div>
    </div>
  );
}
