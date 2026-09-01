import { redirect } from "next/navigation";
import { connection } from "next/server";
import Link from "next/link";
import { Button } from "@/components/Button";
import { DocumentCard } from "@/components/Surfaces";
import { Wordmark } from "@/components/Logo";
import { isDemo } from "@/lib/env";
import { copy } from "@/lib/copy";
import { enterDemo } from "./actions";
import shell from "@/components/shell.module.css";

export const dynamic = "force-dynamic";

/**
 * There is no marketing site in P0. A supplier arrives on an invite link and a
 * buyer arrives on the console; anyone else goes to the sign-in that fits the
 * device they are most likely holding.
 *
 * A public demo is the exception: visitors have no invite and no SMS, so the
 * root becomes a door page into the three seeded surfaces.
 */
export default async function Root() {
  await connection();
  if (!isDemo()) redirect("/s");

  return (
    <div className={shell.page}>
      <div className={shell.supplier}>
        <header className={shell.header}>
          <span className={shell.headerHome}>
            <Wordmark size={26} />
          </span>
        </header>
        <main className={shell.main}>
          <div className={shell.stack}>
            <h1 className={shell.title}>{copy.demo.heading}</h1>
            <p className={shell.lede}>{copy.demo.lede}</p>

            <Door door="supplier" cta={copy.demo.supplierCta} hint={copy.demo.supplierHint} />
            <Door door="buyer" cta={copy.demo.buyerCta} hint={copy.demo.buyerHint} />
            <Door door="operator" cta={copy.demo.operatorCta} hint={copy.demo.operatorHint} />

            <form action={enterDemo}>
              <input type="hidden" name="door" value="invite" />
              <Button type="submit" variant="quiet" block>
                {copy.demo.inviteCta}
              </Button>
            </form>

            <p className={shell.note}>
              <Link href="https://github.com/moyesrex-ops/New-agent-work/pull/1" className={shell.textLink}>
                {copy.demo.source}
              </Link>
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}

function Door({ door, cta, hint }: { door: string; cta: string; hint: string }) {
  return (
    <DocumentCard>
      <p className={shell.lede}>{hint}</p>
      <form action={enterDemo} style={{ marginTop: "var(--space-4)" }}>
        <input type="hidden" name="door" value={door} />
        <Button type="submit" block>
          {cta}
        </Button>
      </form>
    </DocumentCard>
  );
}
