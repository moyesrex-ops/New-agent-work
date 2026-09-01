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
      "A pglite:// URL runs an embedded Postgres for local development and needs\nno service installed. Production is a standard postgres:// connection\nstring to the managed instance in Lagos.",
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
      "When true, this instance is a public demo: it seeds itself, shows a door\npage at /, and offers one-click sessions. Never set this on a real buyer.",
    example: "",
    schema: z.string().optional(),
  },

  STAMPA_GATEWAY: {
    group: "E-invoicing gateway",
    comment:
      "Which transmission path is live: fake | sandbox | partner.\n`fake` issues simulated references, and every surface that shows a stamp\nsays so out loud. sandbox and partner require the credentials below.",
    example: "fake",
    schema: z.enum(["fake", "sandbox", "partner"]).default("fake"),
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
      "Accredited APP/SI partner (Architecture 16.7). Read only when\nSTAMPA_GATEWAY is sandbox or partner; leave blank on the fake gateway.",
    example: "",
    schema: z.union([z.literal(""), z.url()]).optional(),
  },
  APP_PARTNER_CLIENT_ID: {
    group: "E-invoicing gateway",
    comment: "",
    example: "",
    schema: z.string().optional(),
  },
  APP_PARTNER_CLIENT_SECRET: {
    group: "E-invoicing gateway",
    comment: "",
    example: "",
    schema: z.string().optional(),
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
} satisfies Record<string, Spec>;

export type EnvName = keyof typeof SPEC;

export type Env = {
  DATABASE_URL?: string;
  APP_URL?: string;
  STAMPA_DEMO?: string;
  STAMPA_GATEWAY: "fake" | "sandbox" | "partner";
  STAMPA_FAKE_LATENCY_MS: number;
  APP_PARTNER_BASE_URL?: string;
  APP_PARTNER_CLIENT_ID?: string;
  APP_PARTNER_CLIENT_SECRET?: string;
  OTP_PEPPER?: string;
  STAMPA_OPERATORS: string[];
};

/** Reads the raw flag so callers do not have to boot the full contract. */
export function isDemo(source?: { STAMPA_DEMO?: string }): boolean {
  const value = (source ?? process.env).STAMPA_DEMO;
  return value === "true" || value === "1";
}

export type EnvProblem = { name: string; problem: string };

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

  // Cross-field rules. A gateway pointed at a partner with no credentials
  // would fail on the first real invoice, which is the worst possible moment
  // to discover a missing secret.
  if (env.STAMPA_GATEWAY !== "fake") {
    for (const name of ["APP_PARTNER_BASE_URL", "APP_PARTNER_CLIENT_ID", "APP_PARTNER_CLIENT_SECRET"] as const) {
      if (!env[name]) {
        problems.push({ name, problem: `required when STAMPA_GATEWAY=${env.STAMPA_GATEWAY}` });
      }
    }
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
