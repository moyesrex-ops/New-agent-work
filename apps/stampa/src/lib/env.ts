/**
 * The configuration contract (release test RT-07).
 *
 * One declaration, three jobs: it validates the environment at boot, it types
 * every read, and `scripts/build-env-example.mjs` generates `.env.example`
 * from it. That last one is the point. A hand-maintained example file drifts
 * from the code within a month — this repository already had an example
 * listing four variables nothing reads and missing two that everything does —
 * and the person it strands is the one who cloned the repository on their
 * first day.
 *
 * The rule for "required": a variable is required only when its absence would
 * otherwise fail later, further from the cause. A missing DATABASE_URL is
 * fine locally because PGlite has a sane default; a missing OTP_PEPPER in
 * production is not, because the failure is silent and the consequence is
 * unpeppered one-time codes.
 *
 * Production refuses the fake gateway, demo doors, and log-printed OTPs.
 * Local development still runs on fakes so a clone can boot without secrets.
 */
import { z } from "zod";

/** Documentation lives beside the rule so the two cannot disagree. */
type Spec = {
  schema: z.ZodType;
  comment: string;
  /** What the example file suggests. Never a real secret. */
  example: string;
  /** Blocks boot in production when absent. */
  requiredInProduction?: boolean;
  group: string;
};

const emailList = z
  .string()
  .optional()
  .transform((value) => (value ?? "").split(",").map((part) => part.trim().toLowerCase()).filter(Boolean))
  .pipe(z.array(z.email("STAMPA_OPERATORS must be a comma-separated list of email addresses")));

const SPEC = {
  DATABASE_URL: {
    group: "Database",
    comment:
      "A pglite:// URL runs an embedded Postgres for local development and needs\nno service installed. Production is a standard postgres:// connection\nstring. PGlite is refused in production: a serverless filesystem is not a database.",
    example: "pglite://./.data/dev",
    requiredInProduction: true,
    schema: z
      .string()
      .refine(
        (value) => /^(pglite|postgres|postgresql):\/\//.test(value),
        "DATABASE_URL must start with pglite://, postgres:// or postgresql://",
      )
      .optional(),
  },

  APP_URL: {
    group: "Application",
    comment:
      "Absolute origin. Every WhatsApp and SMS deep link is built from it, so a\nwrong value here sends suppliers to a dead page rather than to their\ninvoice. No trailing slash.",
    example: "http://localhost:3000",
    requiredInProduction: true,
    schema: z.url("APP_URL must be an absolute URL").optional(),
  },

  STAMPA_DEMO: {
    group: "Application",
    comment:
      "Legacy flag. Production refuses it. Local tests may still set it to exercise\nthe disabled-door guard. Never set this on a real buyer.",
    example: "",
    schema: z.string().optional(),
  },

  STAMPA_GATEWAY: {
    group: "E-invoicing gateway",
    comment:
      "Which transmission path is live: fake | hold | sandbox | partner.\n`fake` is local and tests only. `hold` is production without an accredited\nAPP/SI: the site runs, stamps fail closed, and no IRN is invented.\n`sandbox` and `partner` require the credentials below.",
    example: "fake",
    schema: z.enum(["fake", "hold", "sandbox", "partner"]).default("fake"),
  },

  STAMPA_FAKE_LATENCY_MS: {
    group: "E-invoicing gateway",
    comment:
      "Artificial delay on the fake gateway, so the waiting states get exercised\nin development instead of only in production.",
    example: "1200",
    schema: z.coerce.number().int().min(0).max(60_000).default(0),
  },

  APP_PARTNER_BASE_URL: {
    group: "E-invoicing gateway",
    comment:
      "Accredited APP/SI partner base URL (Interswitch SwitchTax or equivalent).\nRequired when STAMPA_GATEWAY is sandbox or partner.",
    example: "https://sandbox-api.interswitchng.com",
    schema: z.union([z.literal(""), z.url()]).optional(),
  },
  APP_PARTNER_CLIENT_ID: {
    group: "E-invoicing gateway",
    comment: "OAuth client id for POST /Api/SwitchTax/Token.",
    example: "",
    schema: z.string().optional(),
  },
  APP_PARTNER_CLIENT_SECRET: {
    group: "E-invoicing gateway",
    comment: "OAuth client secret for POST /Api/SwitchTax/Token.",
    example: "",
    schema: z.string().optional(),
  },
  APP_PARTNER_BUSINESS_ID: {
    group: "E-invoicing gateway",
    comment:
      "NRS/APP business_id sent on SignInvoice. Issued by the accredited partner\nwhen the buyer or Stampa is enrolled.",
    example: "",
    schema: z.string().optional(),
  },
  APP_PARTNER_SERVICE_ID: {
    group: "E-invoicing gateway",
    comment: "Service id used in the IRN candidate InvoiceNo-ServiceId-YYYYMMDD.",
    example: "STAMPA",
    schema: z.string().default("STAMPA"),
  },

  OTP_PEPPER: {
    group: "Secrets",
    comment:
      "Peppers the one-time codes before they are hashed, so a database read\ndoes not yield a usable credential. Generate with: openssl rand -base64 32\nRotating it invalidates codes in flight, which is acceptable; they live\nfor ten minutes.",
    example: "",
    requiredInProduction: true,
    schema: z
      .string()
      .min(32, "OTP_PEPPER must be at least 32 characters")
      .optional(),
  },

  STAMPA_OPERATORS: {
    group: "Operator console",
    comment:
      "Comma-separated emails allowed to open /ops. Empty means nobody can,\nwhich is the correct default: an operator console that anyone can reach is\nworse than no operator console.",
    example: "",
    schema: emailList,
  },

  CRON_SECRET: {
    group: "Application",
    comment:
      "Bearer token Vercel sends to /api/cron/retry. Empty disables the route.\nGenerate with: openssl rand -hex 32",
    example: "",
    schema: z.string().optional(),
  },

  TERMII_API_KEY: {
    group: "Messaging",
    comment:
      "Termii API key. Production OTP is SMS on the DND route, then WhatsApp,\nthen voice. Without this key, codes would only exist in a server log.",
    example: "",
    schema: z.string().optional(),
  },
  TERMII_SENDER_ID: {
    group: "Messaging",
    comment:
      "Approved Termii sender id. Talert and SecureOTP are the stock OTP ids.\nA custom Stampa id needs Termii approval first.",
    example: "Talert",
    schema: z.string().default("Talert"),
  },
  TERMII_BASE_URL: {
    group: "Messaging",
    comment: "Termii API origin. Default is the Nigerian cluster.",
    example: "https://api.ng.termii.com",
    schema: z.url().default("https://api.ng.termii.com"),
  },

  WHATSAPP_TOKEN: {
    group: "Messaging",
    comment:
      "Optional Meta Cloud API token. Used when Termii WhatsApp is not available.\nOTP templates must be pre-approved by Meta.",
    example: "",
    schema: z.string().optional(),
  },
  WHATSAPP_PHONE_NUMBER_ID: {
    group: "Messaging",
    comment: "Meta Cloud API phone-number id, required with WHATSAPP_TOKEN.",
    example: "",
    schema: z.string().optional(),
  },
  WHATSAPP_OTP_TEMPLATE: {
    group: "Messaging",
    comment: "Approved WhatsApp authentication template name. Empty sends a session text.",
    example: "",
    schema: z.string().optional(),
  },

  AGENTMAIL_API_KEY: {
    group: "Messaging",
    comment:
      "AgentMail API key. Sends buyer and operator magic links from the company\ninbox stampa-support@agentmail.to.",
    example: "",
    schema: z.string().optional(),
  },
  AGENTMAIL_INBOX_ID: {
    group: "Messaging",
    comment: "AgentMail inbox id, usually the address itself.",
    example: "stampa-support@agentmail.to",
    schema: z.string().default("stampa-support@agentmail.to"),
  },
  RESEND_API_KEY: {
    group: "Messaging",
    comment: "Optional Resend key, used when AgentMail is not configured.",
    example: "",
    schema: z.string().optional(),
  },
  MAIL_FROM: {
    group: "Messaging",
    comment: "From header for Resend. AgentMail uses the inbox address.",
    example: "Stampa <stampa-support@agentmail.to>",
    schema: z.string().default("Stampa <stampa-support@agentmail.to>"),
  },
  SUPPORT_EMAIL: {
    group: "Messaging",
    comment: "Public support address shown on the site and help screen.",
    example: "stampa-support@agentmail.to",
    schema: z.string().default("stampa-support@agentmail.to"),
  },
} satisfies Record<string, Spec>;

export type EnvName = keyof typeof SPEC;

export type Env = {
  DATABASE_URL?: string;
  APP_URL?: string;
  STAMPA_DEMO?: string;
  STAMPA_GATEWAY: "fake" | "hold" | "sandbox" | "partner";
  STAMPA_FAKE_LATENCY_MS: number;
  APP_PARTNER_BASE_URL?: string;
  APP_PARTNER_CLIENT_ID?: string;
  APP_PARTNER_CLIENT_SECRET?: string;
  APP_PARTNER_BUSINESS_ID?: string;
  APP_PARTNER_SERVICE_ID: string;
  OTP_PEPPER?: string;
  CRON_SECRET?: string;
  STAMPA_OPERATORS: string[];
  TERMII_API_KEY?: string;
  TERMII_SENDER_ID: string;
  TERMII_BASE_URL: string;
  WHATSAPP_TOKEN?: string;
  WHATSAPP_PHONE_NUMBER_ID?: string;
  WHATSAPP_OTP_TEMPLATE?: string;
  AGENTMAIL_API_KEY?: string;
  AGENTMAIL_INBOX_ID: string;
  RESEND_API_KEY?: string;
  MAIL_FROM: string;
  SUPPORT_EMAIL: string;
};

/** Reads the raw flag so callers do not have to boot the full contract. */
export function isDemo(source: { STAMPA_DEMO?: string } = process.env as { STAMPA_DEMO?: string }): boolean {
  const value = source.STAMPA_DEMO;
  return value === "true" || value === "1";
}

export type EnvProblem = { name: string; problem: string };

function hasMailer(env: Env): boolean {
  return Boolean(env.AGENTMAIL_API_KEY || env.RESEND_API_KEY);
}

/**
 * Validate without throwing, so the caller decides whether a problem is fatal.
 * The health endpoint wants the list; boot wants the exception.
 */
export function checkEnv(source: NodeJS.ProcessEnv = process.env): {
  env: Env;
  problems: EnvProblem[];
} {
  const problems: EnvProblem[] = [];
  const parsed: Record<string, unknown> = {};
  const production = source.NODE_ENV === "production";

  for (const [name, spec] of Object.entries(SPEC) as Array<[EnvName, Spec]>) {
    const raw = source[name];
    const present = raw !== undefined && raw !== "";

    if (!present && spec.requiredInProduction && production) {
      problems.push({ name, problem: "required in production and not set" });
      continue;
    }

    const result = spec.schema.safeParse(present ? raw : undefined);
    if (result.success) parsed[name] = result.data;
    else problems.push({ name, problem: result.error.issues[0]?.message ?? "invalid" });
  }

  const env = parsed as Env;

  if (production && isDemo({ STAMPA_DEMO: source.STAMPA_DEMO })) {
    problems.push({
      name: "STAMPA_DEMO",
      problem: "demo doors are not allowed in production",
    });
  }

  if (production && env.STAMPA_GATEWAY === "fake") {
    problems.push({
      name: "STAMPA_GATEWAY",
      problem: "fake is not allowed in production; set hold, sandbox or partner",
    });
  }

  if (production && env.DATABASE_URL?.startsWith("pglite:")) {
    problems.push({
      name: "DATABASE_URL",
      problem: "pglite is not durable on a serverless host; use postgres://",
    });
  }

  // Cross-field rules. A gateway pointed at a partner with no credentials
  // would fail on the first real invoice, which is the worst possible moment
  // to discover a missing secret. `hold` is the production web host until
  // those credentials exist: it never invents an IRN.
  if (env.STAMPA_GATEWAY === "sandbox" || env.STAMPA_GATEWAY === "partner") {
    for (const name of [
      "APP_PARTNER_BASE_URL",
      "APP_PARTNER_CLIENT_ID",
      "APP_PARTNER_CLIENT_SECRET",
      "APP_PARTNER_BUSINESS_ID",
    ] as const) {
      if (!env[name]) {
        problems.push({ name, problem: `required when STAMPA_GATEWAY=${env.STAMPA_GATEWAY}` });
      }
    }
  }

  if (production && !env.TERMII_API_KEY) {
    problems.push({
      name: "TERMII_API_KEY",
      problem: "required in production so one-time codes are delivered, not logged",
    });
  }

  if (production && !hasMailer(env)) {
    problems.push({
      name: "AGENTMAIL_API_KEY",
      problem: "required in production (or set RESEND_API_KEY) so magic links leave the server",
    });
  }

  if (env.WHATSAPP_TOKEN && !env.WHATSAPP_PHONE_NUMBER_ID) {
    problems.push({
      name: "WHATSAPP_PHONE_NUMBER_ID",
      problem: "required when WHATSAPP_TOKEN is set",
    });
  }

  return { env, problems };
}

export function formatProblems(problems: EnvProblem[]): string {
  return [
    "Configuration is not valid, so the app will not start:",
    ...problems.map(({ name, problem }) => `  ${name}: ${problem}`),
    "",
    "See .env.example for the full contract.",
  ].join("\n");
}

let cached: Env | null = null;

/**
 * Throws on the first read if the environment is wrong.
 *
 * Cached only in production. Tests set variables between cases, and a cache
 * that outlived them would make the suite order-dependent — which is a worse
 * problem than re-parsing nine strings.
 */
export function env(): Env {
  if (cached) return cached;
  const { env: parsed, problems } = checkEnv();
  if (problems.length) throw new Error(formatProblems(problems));
  if (process.env.NODE_ENV === "production") cached = parsed;
  return parsed;
}

/** Used by scripts/build-env-example.mts. Not part of the runtime path. */
export function envSpec(): Record<string, Omit<Spec, "schema">> {
  return Object.fromEntries(
    (Object.entries(SPEC) as Array<[EnvName, Spec]>).map(
      ([name, { comment, example, requiredInProduction, group }]) => [
        name,
        { comment, example, requiredInProduction, group },
      ],
    ),
  );
}
