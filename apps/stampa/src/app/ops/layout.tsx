import Link from "next/link";
import { Mark } from "@/components/Logo";
import { copy } from "@/lib/copy";
import { currentPrincipal } from "@/lib/auth/session";
import { isSimulatedGateway } from "@/lib/gateway";
import shell from "@/components/shell.module.css";

/**
 * Operator shell.
 *
 * Visibly a different room: sunken page, a permanent black bar saying actions
 * are logged. Phase 15 allows the operator console to be quieter but never
 * leftover, and the bar is there so nobody forgets which console they are in
 * while looking at a stranger's tax records.
 */
export default async function OperatorLayout({ children }: { children: React.ReactNode }) {
  const principal = await currentPrincipal();
  const signedIn = principal.role === "operator";

  return (
    <div className={[shell.page, shell.operatorPage].join(" ")}>
      <p className={shell.operatorBar}>{copy.operator.banner}</p>
      {isSimulatedGateway() ? (
        <p className={shell.operatorBar} style={{ background: "var(--color-warning-700)" }}>
          FAKE GATEWAY — references on this instance are not real tax records
        </p>
      ) : null}

      <div className={shell.console}>
        <header className={shell.consoleHeader}>
          <Link href="/ops" aria-label="Operator console" className={shell.consoleHome}>
            <Mark size={24} />
          </Link>
          {signedIn ? (
            <nav className={shell.nav} aria-label="Operator">
              <Link href="/ops" className={shell.navLink}>
                Today
              </Link>
              <Link href="/ops/failures" className={shell.navLink}>
                Failures
              </Link>
              <Link href="/ops/lookup" className={shell.navLink}>
                Lookup
              </Link>
              <Link href="/ops/flags" className={shell.navLink}>
                Flags
              </Link>
              <Link href="/ops/audit" className={shell.navLink}>
                Audit
              </Link>
            </nav>
          ) : null}
        </header>
        <main className={shell.main}>{children}</main>
      </div>
    </div>
  );
}
