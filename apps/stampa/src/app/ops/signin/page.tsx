import { redirect } from "next/navigation";
import { Button } from "@/components/Button";
import { Field } from "@/components/Field";
import { Banner, Card } from "@/components/Surfaces";
import { currentPrincipal } from "@/lib/auth/session";
import { copy } from "@/lib/copy";
import { isDemo } from "@/lib/env";
import { requestOperatorLink } from "../actions";
import { enterDemo } from "@/app/actions";
import shell from "@/components/shell.module.css";

const ERRORS: Record<string, string> = {
  empty: "Enter your Stampa email address.",
  malformed: "That does not look like an email address.",
  not_work_email: "Operator access is for Stampa addresses only.",
  expired: "That link has expired.",
  used: "That link has already been used.",
  invalid: "That link is not valid.",
};

export default async function OperatorSignIn({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  const principal = await currentPrincipal();
  if (principal.role === "operator") redirect("/ops");

  const { error, sent } = await searchParams;

  return (
    <div style={{ maxWidth: 400, marginInline: "auto", paddingTop: "var(--space-10)" }}>
      <Card>
        <h1 className={shell.title}>Operator sign-in</h1>
        <p className={shell.note} style={{ marginBottom: "var(--space-5)" }}>
          Everything you do in here is written to the audit log with your name on it.
        </p>

        {sent ? (
          <div style={{ marginBottom: "var(--space-5)" }}>
            {/* Identical whether or not the address is on the operator list. */}
            <Banner tone="neutral">{copy.buyer.signInSent(sent)}</Banner>
          </div>
        ) : null}

        <form action={requestOperatorLink}>
          <Field
            name="email"
            label="Stampa email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            required
            error={error ? (ERRORS[error] ?? copy.errors.generic) : undefined}
          />
          <Button type="submit" block>
            {copy.buyer.signInCta}
          </Button>
        </form>
        {isDemo() ? (
          <form action={enterDemo} style={{ marginTop: "var(--space-3)" }}>
            <input type="hidden" name="door" value="operator" />
            <Button type="submit" variant="quiet" block>
              {copy.demo.skipSignIn}
            </Button>
          </form>
        ) : null}
      </Card>
    </div>
  );
}
