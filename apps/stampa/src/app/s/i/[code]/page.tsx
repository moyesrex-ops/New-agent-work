import { notFound } from "next/navigation";
import { Button } from "@/components/Button";
import { DocumentCard, ErrorState } from "@/components/Surfaces";
import { copy, BRAND } from "@/lib/copy";
import { isDemo } from "@/lib/env";
import { openInvite } from "@/lib/services/onboarding";
import { beginInvite } from "../../actions";
import { enterDemo } from "@/app/actions";
import shell from "@/components/shell.module.css";

export const dynamic = "force-dynamic";

/**
 * S1 — Invite landing.
 *
 * The buyer's registered legal name is the largest thing on the screen,
 * larger than "Stampa". The authority being borrowed is theirs, and a
 * suspicious supplier is looking for a name they already accept before they
 * look for anything else (Trust script, mechanism 1).
 */
export default async function InviteLanding({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const invite = await openInvite(decodeURIComponent(code));

  if (invite.state === "invalid") {
    return (
      <ErrorState
        status="rejected"
        what={copy.invite.invalidHeading}
        why={copy.invite.invalidBody}
        reassurance={copy.invite.doubt}
        action={
          <a href={`tel:${BRAND.supportPhone}`} className={shell.textLink}>
            {copy.callUs(BRAND.supportPhone)}
          </a>
        }
      />
    );
  }

  if (invite.state === "expired") {
    return (
      <ErrorState
        status="rejected"
        what={copy.invite.expiredHeading}
        why={copy.invite.expiredBody}
        reassurance={copy.invite.doubt}
        action={
          <a href={`tel:${BRAND.supportPhone}`} className={shell.textLink}>
            {copy.callUs(BRAND.supportPhone)}
          </a>
        }
      />
    );
  }

  if (!invite.buyerName) notFound();

  return (
    <div className={shell.stack}>
      <DocumentCard label={copy.invite.cardLabel(invite.buyerName)}>
        <h1 className={shell.display}>{copy.invite.heading(invite.buyerName)}</h1>
        <p className={shell.lede} style={{ marginTop: "var(--space-4)" }}>
          {copy.invite.body(invite.buyerName)}
        </p>
        <p className={shell.lede} style={{ marginTop: "var(--space-4)" }}>
          {copy.invite.duration}
        </p>
        {/* Above the fold, before any field. Trust script, mechanism 2. */}
        <p className={shell.free} style={{ marginTop: "var(--space-3)" }}>
          {copy.invite.free}
        </p>
      </DocumentCard>

      <form action={beginInvite} className={shell.actionBar}>
        <input type="hidden" name="code" value={invite.code} />
        <Button type="submit" block>
          {copy.invite.cta}
        </Button>
      </form>

      {isDemo() ? (
        <form action={enterDemo}>
          <input type="hidden" name="door" value="invite" />
          <Button type="submit" variant="quiet" block>
            {copy.demo.skipCode}
          </Button>
        </form>
      ) : null}

      <p className={shell.note}>{copy.invite.doubt}</p>
    </div>
  );
}
