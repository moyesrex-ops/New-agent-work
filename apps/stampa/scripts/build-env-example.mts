/**
 * Generates .env.example from the schema in src/lib/env.ts.
 *
 * `--check` exits non-zero when the file is stale, which is what stops the
 * example drifting from the code. Same contract as build-tokens.mjs.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { envSpec } from "../src/lib/env";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const target = resolve(root, ".env.example");

const spec = envSpec();
const groups = [...new Set(Object.values(spec).map((entry) => entry.group))];

const lines = [
  "# Generated from src/lib/env.ts by `npm run env:example`. Do not edit.",
  "#",
  "# Copy to .env.local for development. Never commit real values.",
  "# Entries marked (required in production) block boot when unset.",
];

for (const group of groups) {
  lines.push("", `# ---- ${group} ----`);

  for (const [name, entry] of Object.entries(spec)) {
    if (entry.group !== group) continue;
    lines.push("");
    if (entry.comment) {
      for (const line of entry.comment.split("\n")) lines.push(`# ${line}`);
    }
    if (entry.requiredInProduction) lines.push("# (required in production)");
    lines.push(`${name}=${entry.example}`);
  }
}

const next = lines.join("\n") + "\n";
const check = process.argv.includes("--check");

let current: string | null = null;
try {
  current = readFileSync(target, "utf8");
} catch {
  /* not generated yet */
}

if (current === next) {
  console.log(".env.example up to date");
} else if (check) {
  console.error(".env.example is stale. Run `npm run env:example` and commit it.");
  process.exit(1);
} else {
  writeFileSync(target, next);
  console.log(`wrote .env.example (${Object.keys(spec).length} variables)`);
}
