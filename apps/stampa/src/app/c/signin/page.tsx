import { redirect } from "next/navigation";
import { Button } from "@/components/Button";
import { Field } from "@/components/Field";
import { Banner, Card } from "@/components/Surfaces";
import { currentPrincipal } from "@/lib/auth/session";
import { copy } from "@/lib/copy";
import { isDemo } from "@/lib/env";
import { requestMagicLink } from "../actions";
import { enterDemo } from "@/app/actions";
import shell from "@/components/shell.module.css";

export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  empty: copy.buyer.signInErrors.empty,
  malformed: copy.buyer.signInErrors.malformed,
  not_work_email: copy.buyer.signInWorkEmail,
  expired: "That link has expired. We will send you another one.",
  used: "That link has already been used. Ask for a new one.",
  invalid: "That link is not valid. Ask for a new one.",
};

export default async function BuyerSignIn({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  const principal = await currentPrincipal();
  if (principal.role === "buyer_admin" || principal.role === "buyer_member") redirect("/c");

  const { error, sent } = await searchParams;

  return (
    <div style={{ maxWidth: 420, marginInline: "auto", paddingTop: "var(--space-10)" }}>
      <Card>
        <h1 className={shell.title}>{copy.buyer.signInHeading}</h1>
        <p className={shell.lede} style={{ marginBottom: "var(--space-5)" }}>
          {copy.buyer.signInBody}
        </p>

        {sent ? (
          <div style={{ marginBottom: "var(--space-5)" }}>
            <Banner tone="neutral">{copy.buyer.signInSent(sent)}</Banner>
          </div>
        ) : null}

        <form action={requestMagicLink}>
          <Field
            name="email"
            label={copy.buyer.signInLabel}
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="tax.manager@yourcompany.com"
            required
            error={error ? (ERRORS[error] ?? copy.errors.generic) : undefined}
          />
          <Button type="submit" block>
            {copy.buyer.signInCta}
          </Button>
        </form>
        {isDemo() ? (
          <form action={enterDemo} style={{ marginTop: "var(--space-3)" }}>
            <input type="hidden" name="door" value="buyer" />
            <Button type="submit" variant="quiet" block>
              {copy.demo.skipSignIn}
            </Button>
          </form>
        ) : null}
      </Card>
    </div>
  );
}
