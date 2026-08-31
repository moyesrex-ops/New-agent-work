/**
 * Hard-delete the accounts whose thirty-day window has closed.
 *
 * `softDeleteAccount` writes an audit row promising this will happen. Nothing
 * else keeps that promise, so this runs daily from cron. See RUNBOOK.md.
 */
import { purgeDeletedAccounts } from "../src/lib/services/account";

const purged = await purgeDeletedAccounts();
console.log(`purged ${purged} account${purged === 1 ? "" : "s"}`);
process.exit(0);
