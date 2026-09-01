/** Seed the local database. Refuses to run against production (see seed.ts). */
import { seed } from "../src/lib/services/seed";

const result = await seed();
console.log(`seeded. invite: /s/i/${result.inviteCode}`);
process.exit(0);
