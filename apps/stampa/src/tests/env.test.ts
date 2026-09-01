/**
 * The configuration contract (release test RT-07).
 *
 * These assert the two failure modes that matter: booting production without a
 * secret, and booting a real gateway without credentials. Both are silent
 * until a supplier is affected, which is why they are tested rather than
 * documented.
 */
import { describe, expect, it } from "vitest";
import { checkEnv, formatProblems } from "@/lib/env";

const PEPPER = "a".repeat(32);

function production(overrides: Record<string, string> = {}) {
  return checkEnv({
    NODE_ENV: "production",
    DATABASE_URL: "postgres://stampa@db.internal:5432/stampa",
    APP_URL: "https://stampa.ng",
    OTP_PEPPER: PEPPER,
    STAMPA_GATEWAY: "partner",
    APP_PARTNER_BASE_URL: "https://partner.example.ng",
    APP_PARTNER_CLIENT_ID: "stampa",
    APP_PARTNER_CLIENT_SECRET: "s3cret",
    APP_PARTNER_BUSINESS_ID: "biz-1",
    APP_PARTNER_SERVICE_ID: "STAMPA",
    TERMII_API_KEY: "tk_test",
    AGENTMAIL_API_KEY: "am_test",
    AGENTMAIL_INBOX_ID: "stampa-support@agentmail.to",
    ...overrides,
  } as NodeJS.ProcessEnv);
}

function named(problems: Array<{ name: string }>): string[] {
  return problems.map((problem) => problem.name);
}

describe("Given a local checkout with nothing configured", () => {
  it("Then it is valid, because a clone must run without a secret", () => {
    const { problems, env } = checkEnv({} as NodeJS.ProcessEnv);
    expect(problems).toEqual([]);
    expect(env.STAMPA_GATEWAY).toBe("fake");
    expect(env.STAMPA_FAKE_LATENCY_MS).toBe(0);
    expect(env.STAMPA_OPERATORS).toEqual([]);
  });
});

describe("Given production, When a required variable is missing", () => {
  it("Then a missing database URL is named", () => {
    const { problems } = production({ DATABASE_URL: "" });
    expect(named(problems)).toContain("DATABASE_URL");
  });

  it("Then a missing OTP pepper is named, because unpeppered codes fail silently", () => {
    const { problems } = production({ OTP_PEPPER: "" });
    expect(named(problems)).toContain("OTP_PEPPER");
  });

  it("Then a short OTP pepper is refused rather than accepted quietly", () => {
    const { problems } = production({ OTP_PEPPER: "too-short" });
    expect(named(problems)).toContain("OTP_PEPPER");
  });

  it("Then a missing APP_URL is named, because deep links would point nowhere", () => {
    const { problems } = production({ APP_URL: "" });
    expect(named(problems)).toContain("APP_URL");
  });

  it("Then a fully configured production environment has no problems", () => {
    expect(production().problems).toEqual([]);
  });

  it("Then a missing Termii key is named, because OTP would only exist in a log", () => {
    expect(named(production({ TERMII_API_KEY: "" }).problems)).toContain("TERMII_API_KEY");
  });

  it("Then a missing mailer is named", () => {
    expect(named(production({ AGENTMAIL_API_KEY: "", RESEND_API_KEY: "" }).problems)).toContain(
      "AGENTMAIL_API_KEY",
    );
  });

  it("Then Resend is accepted as the mailer", () => {
    expect(
      production({ AGENTMAIL_API_KEY: "", RESEND_API_KEY: "re_test" }).problems,
    ).toEqual([]);
  });
});

describe("Given a malformed value, When the environment is checked", () => {
  it("Then a database URL with an unknown scheme is refused", () => {
    const { problems } = production({ DATABASE_URL: "mysql://localhost/stampa" });
    expect(named(problems)).toContain("DATABASE_URL");
  });

  it("Then a relative APP_URL is refused", () => {
    const { problems } = production({ APP_URL: "/app" });
    expect(named(problems)).toContain("APP_URL");
  });

  it("Then an unknown gateway mode is refused rather than silently treated as fake", () => {
    const { problems } = production({ STAMPA_GATEWAY: "live" });
    expect(named(problems)).toContain("STAMPA_GATEWAY");
  });

  it("Then a non-email in the operator list is refused", () => {
    const { problems } = production({ STAMPA_OPERATORS: "ops@stampa.ng, not-an-email" });
    expect(named(problems)).toContain("STAMPA_OPERATORS");
  });

  it("Then operator emails are trimmed and lowercased", () => {
    const { env } = production({ STAMPA_OPERATORS: " Ops@Stampa.NG , second@stampa.ng " });
    expect(env.STAMPA_OPERATORS).toEqual(["ops@stampa.ng", "second@stampa.ng"]);
  });
});

describe("Given a real gateway is selected, When credentials are absent", () => {
  it("Then boot is blocked rather than the first live invoice", () => {
    const { problems } = production({
      APP_PARTNER_BASE_URL: "",
      APP_PARTNER_CLIENT_ID: "",
      APP_PARTNER_CLIENT_SECRET: "",
      APP_PARTNER_BUSINESS_ID: "",
    });
    expect(named(problems)).toEqual(
      expect.arrayContaining([
        "APP_PARTNER_BASE_URL",
        "APP_PARTNER_CLIENT_ID",
        "APP_PARTNER_CLIENT_SECRET",
        "APP_PARTNER_BUSINESS_ID",
      ]),
    );
  });

  it("Then the sandbox is held to the same standard as the partner", () => {
    const { problems } = production({
      STAMPA_GATEWAY: "sandbox",
      APP_PARTNER_CLIENT_SECRET: "",
    });
    expect(named(problems)).toContain("APP_PARTNER_CLIENT_SECRET");
  });

  it("Then a complete partner configuration passes", () => {
    expect(production().problems).toEqual([]);
  });

  it("Then the fake gateway is refused in production", () => {
    expect(named(production({ STAMPA_GATEWAY: "fake" }).problems)).toContain("STAMPA_GATEWAY");
  });

  it("Then a demo flag is refused in production", () => {
    expect(named(production({ STAMPA_DEMO: "true" }).problems)).toContain("STAMPA_DEMO");
  });
});

describe("the message a deploy sees", () => {
  it("names every variable and points at the contract", () => {
    const { problems } = production({ OTP_PEPPER: "", APP_URL: "" });
    const message = formatProblems(problems);

    expect(message).toContain("OTP_PEPPER");
    expect(message).toContain("APP_URL");
    expect(message).toContain(".env.example");
  });

  it("never echoes the offending secret back into a log", () => {
    const { problems } = production({ OTP_PEPPER: "short-but-secret" });
    expect(formatProblems(problems)).not.toContain("short-but-secret");
  });
});
