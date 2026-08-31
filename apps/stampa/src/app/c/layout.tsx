import Link from "next/link";
import { Wordmark } from "@/components/Logo";
import { BRAND, copy } from "@/lib/copy";
import { currentPrincipal } from "@/lib/auth/session";
import shell from "@/components/shell.module.css";

/**
 * Buyer console shell.
 *
 * Quieter than the supplier app and denser, but built from the same tokens —
 * Phase 15 forbids a second personality in the console, and "unfinished admin
 * beside a loud marketing surface" is a named cheap tell.
 */
export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const principal = await currentPrincipal();
  const signedIn = principal.role === "buyer_admin" || principal.role === "buyer_member";

  return (
    <div className={shell.page}>
      <div className={shell.console}>
        <header className={shell.consoleHeader}>
          <Link href="/c" aria-label={copy.a11y.consoleHome} className={shell.consoleHome}>
            <Wordmark size={22} />
          </Link>
          {/* No navigation before sign-in: a sign-in page with menu items
              behind it is a set of dead links. */}
          {signedIn ? (
            <nav className={shell.nav} aria-label={copy.nav.console}>
              <Link href="/c" className={shell.navLink}>
                {copy.nav.overview}
              </Link>
              <Link href="/c/suppliers" className={shell.navLink}>
                {copy.nav.suppliers}
              </Link>
              <Link href="/c/invoices" className={shell.navLink}>
                {copy.nav.invoices}
              </Link>
              <Link href="/c/settings" className={shell.navLink}>
                {copy.nav.settings}
              </Link>
            </nav>
          ) : null}
        </header>
        <main className={shell.main}>{children}</main>
        <footer className={shell.note} style={{ paddingBottom: "var(--space-6)" }}>
          {BRAND.name} · {BRAND.supportPhone} · {BRAND.supportHours}
        </footer>
      </div>
    </div>
  );
}
