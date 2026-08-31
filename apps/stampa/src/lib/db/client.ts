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
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { drizzle as drizzlePg, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { drizzle as drizzlePglite, type PgliteDatabase } from "drizzle-orm/pglite";
import { sql } from "drizzle-orm";
import * as schema from "./schema";

export type Db = NodePgDatabase<typeof schema> | PgliteDatabase<typeof schema>;

const MIGRATION = resolve(process.cwd(), "drizzle/0000_init.sql");

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

async function applySchema(db: Db): Promise<void> {
  const statements = readFileSync(MIGRATION, "utf8")
    .split("--> statement-breakpoint")
    .map((statement) => statement.trim())
    .filter(Boolean);

  for (const statement of statements) {
    await db.execute(sql.raw(statement));
  }
  await db.execute(sql.raw(BANK_REVOCATION));
}

type Cache = { db: Db | null; ready: Promise<Db> | null };

// Next.js recreates modules on hot reload; a per-request PGlite instance would
// mean a per-request empty database.
const globalCache = globalThis as unknown as { __stampaDb?: Cache };
const cache: Cache = (globalCache.__stampaDb ??= { db: null, ready: null });

async function connect(): Promise<Db> {
  const url = process.env.DATABASE_URL;

  if (url && !url.startsWith("pglite:")) {
    const { Pool } = await import("pg");
    return drizzlePg(new Pool({ connectionString: url }), { schema });
  }

  const { PGlite } = await import("@electric-sql/pglite");
  // `pglite://./.data/dev` persists to disk; no path means in-memory, which is
  // what the test suite wants.
  const dataDir = url?.replace(/^pglite:\/\//, "") || undefined;
  const client = new PGlite(dataDir);
  const db = drizzlePglite(client, { schema });
  await applySchema(db);
  return db;
}

export function getDb(): Promise<Db> {
  cache.ready ??= connect().then((db) => {
    cache.db = db;
    return db;
  });
  return cache.ready;
}

/** Fresh, isolated, in-memory database. One per test file. */
export async function createTestDb(): Promise<Db> {
  const { PGlite } = await import("@electric-sql/pglite");
  const db = drizzlePglite(new PGlite(), { schema });
  await applySchema(db);
  return db;
}

/**
 * Point `getDb()` at a test database. Services take no db argument by design —
 * threading one through every call site would be noise in application code to
 * serve the tests. This is the seam instead.
 */
export function useDbForTesting(db: Db): void {
  cache.db = db;
  cache.ready = Promise.resolve(db);
}

export { schema };
