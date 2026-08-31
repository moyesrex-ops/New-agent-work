/**
 * Database client.
 *
 * Production is managed Postgres 16 in Lagos, over node-postgres.
 * Local development and tests run PGlite — Postgres 16 compiled to
 * WebAssembly — so no service has to be installed to run the suite, and the
 * SQL under test is real Postgres rather than an approximation.
 *
 * The Drizzle schema is identical across both. Only the driver differs.
 */
import { mkdirSync, readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { drizzle as drizzlePg, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { drizzle as drizzlePglite, type PgliteDatabase } from "drizzle-orm/pglite";
import { sql } from "drizzle-orm";
import { env } from "../env";
import * as schema from "./schema";

export type Db = NodePgDatabase<typeof schema> | PgliteDatabase<typeof schema>;

const MIGRATIONS_DIR = resolve(process.cwd(), "drizzle");

/**
 * Column-level revocation of write access to the bank fields (ticket A-07).
 *
 * This is the single most important permission in the system: it closes the
 * payment-diversion attack from Simulation 8 at the database layer, so an
 * application bug cannot reopen it. It applies only where a dedicated
 * application role exists, which is production; locally the same rule is
 * enforced by `assertNoBankWrite` in policy.ts.
 */
const BANK_REVOCATION = `
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'stampa_app') THEN
    REVOKE UPDATE (bank_name, bank_last4) ON supplier_links FROM stampa_app;
  END IF;
END
$$;
`;

/**
 * Apply every migration that has not run yet, in filename order.
 *
 * Deliberately not drizzle-kit's runner: this has to work identically over
 * PGlite and node-postgres, and it is thirty lines. Applied names are recorded
 * so a persistent data directory is not rebuilt on every boot.
 *
 * Against Postgres this is a deploy step (`npm run migrate`), never a lazy
 * first-request one. Two instances rolling out at once would otherwise race
 * each other through the same DDL.
 */
export async function migrate(db: Db): Promise<void> {
  await db.execute(
    sql.raw(
      `CREATE TABLE IF NOT EXISTS _migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())`,
    ),
  );

  const result = await db.execute(sql.raw(`SELECT name FROM _migrations`));
  const rows = (result as unknown as { rows?: Array<{ name: string }> }).rows ?? [];
  const applied = new Set(rows.map((row) => row.name));

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const name = file.replace(/\.sql$/, "");
    if (applied.has(name)) continue;

    const statements = readFileSync(resolve(MIGRATIONS_DIR, file), "utf8")
      .split("--> statement-breakpoint")
      .map((statement) => statement.trim())
      .filter(Boolean);

    for (const statement of statements) {
      await db.execute(sql.raw(statement));
    }
    await db.execute(sql`INSERT INTO _migrations (name) VALUES (${name})`);
  }

  // Idempotent, and cheap. Re-asserted on every migration run so a restored
  // backup cannot come back without the bank-column revocation in place —
  // which is the one permission that closes the payment-diversion attack.
  await db.execute(sql.raw(BANK_REVOCATION));
}

type Cache = { db: Db | null; ready: Promise<Db> | null };

// Next.js recreates modules on hot reload; a per-request PGlite instance would
// mean a per-request empty database.
const globalCache = globalThis as unknown as { __stampaDb?: Cache };
const cache: Cache = (globalCache.__stampaDb ??= { db: null, ready: null });

/** Connect without touching the schema. Used by the migration script. */
export async function connect(): Promise<Db> {
  const url = env().DATABASE_URL;

  if (url && !url.startsWith("pglite:")) {
    const { Pool } = await import("pg");
    return drizzlePg(new Pool({ connectionString: url }), { schema });
  }

  const { PGlite } = await import("@electric-sql/pglite");
  // `pglite://./.data/dev` persists to disk; no path means in-memory, which is
  // what the test suite wants.
  const dataDir = url?.replace(/^pglite:\/\//, "") || undefined;
  // PGlite's node filesystem creates only the leaf directory, so a fresh
  // checkout with no .data at all fails on the first boot.
  if (dataDir) mkdirSync(dataDir, { recursive: true });
  return drizzlePglite(new PGlite(dataDir), { schema });
}

async function open(): Promise<Db> {
  const db = await connect();

  // Embedded Postgres has no deploy step to hang a migration off, and an
  // in-memory instance starts empty every time, so the convenience is applied
  // here and only here. A managed Postgres is migrated by `npm run migrate`.
  const url = env().DATABASE_URL;
  if (!url || url.startsWith("pglite:")) await migrate(db);

  return db;
}

export function getDb(): Promise<Db> {
  cache.ready ??= open().then((db) => {
    cache.db = db;
    return db;
  });
  return cache.ready;
}

/** Fresh, isolated, in-memory database. One per test file. */
export async function createTestDb(): Promise<Db> {
  const { PGlite } = await import("@electric-sql/pglite");
  const db = drizzlePglite(new PGlite(), { schema });
  await migrate(db);
  return db;
}

/**
 * Has every migration on disk been applied? The health endpoint asks this, so
 * an instance that started against a database one migration behind says so
 * instead of failing on whichever query needs the new column.
 */
export async function pendingMigrations(db: Db): Promise<string[]> {
  const result = await db.execute(sql.raw(`SELECT name FROM _migrations`)).catch(() => null);
  if (!result) return migrationNames();

  const rows = (result as unknown as { rows?: Array<{ name: string }> }).rows ?? [];
  const applied = new Set(rows.map((row) => row.name));
  return migrationNames().filter((name) => !applied.has(name));
}

function migrationNames(): string[] {
  return readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith(".sql"))
    .sort()
    .map((file) => file.replace(/\.sql$/, ""));
}

/**
 * Point `getDb()` at a test database. Services take no db argument by design —
 * threading one through every call site would be noise in application code to
 * serve the tests. This is the seam instead.
 */
export function setTestDb(db: Db): void {
  cache.db = db;
  cache.ready = Promise.resolve(db);
}

export { schema };
