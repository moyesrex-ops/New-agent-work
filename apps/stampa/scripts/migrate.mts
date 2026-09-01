/**
 * The deploy step. Run this before the new instances take traffic.
 *
 * Separate from the app on purpose: applying DDL from a request handler means
 * two instances rolling out together race each other through the same
 * migration, and the loser's error surfaces as a failed invoice.
 */
import { connect, migrate, pendingMigrations } from "../src/lib/db/client";
import { checkEnv, formatProblems } from "../src/lib/env";

const { problems } = checkEnv();
if (problems.length) {
  console.error(formatProblems(problems));
  process.exit(1);
}

const db = await connect();
const pending = await pendingMigrations(db);

if (pending.length === 0) {
  console.log("no pending migrations");
} else {
  console.log(`applying ${pending.length}:\n  ${pending.join("\n  ")}`);
  await migrate(db);
  console.log("done");
}

process.exit(0);
