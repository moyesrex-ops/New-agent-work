/**
 * Production liveness. Names problems, never values.
 *
 * A public JSON blob that echoed OTP_PEPPER or a connection string would be a
 * worse incident than a 503 with the variable's name.
 */
import { sql } from "drizzle-orm";
import { getDb, pendingMigrations } from "./db/client";
import { checkEnv } from "./env";

export type HealthSnapshot = {
  ok: boolean;
  gateway: "fake" | "hold" | "sandbox" | "partner" | "unknown";
  database: "up" | "down";
  pendingMigrations: number;
  problems: Array<{ name: string }>;
};

export async function healthSnapshot(): Promise<HealthSnapshot> {
  const { env, problems } = checkEnv();
  const gateway = env.STAMPA_GATEWAY ?? "unknown";
  const named = problems.map(({ name }) => ({ name }));

  if (problems.length) {
    return {
      ok: false,
      gateway,
      database: "down",
      pendingMigrations: 0,
      problems: named,
    };
  }

  try {
    const db = await getDb();
    await db.execute(sql`select 1`);
    const pending = await pendingMigrations(db);
    return {
      ok: pending.length === 0,
      gateway,
      database: "up",
      pendingMigrations: pending.length,
      problems: pending.length ? [{ name: "MIGRATIONS" }] : [],
    };
  } catch {
    return {
      ok: false,
      gateway,
      database: "down",
      pendingMigrations: 0,
      problems: [{ name: "DATABASE_URL" }],
    };
  }
}
