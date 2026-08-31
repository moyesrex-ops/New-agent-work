/**
 * Generates src/styles/tokens.css and src/lib/tokens.ts from the locked
 * design-tokens/tokens.json.
 *
 * `node scripts/build-tokens.mjs --check` exits non-zero when the generated
 * files are stale, which is what makes ticket F-02 enforceable in CI.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const source = resolve(root, "../../design-tokens/tokens.json");
const cssOut = resolve(root, "src/styles/tokens.css");
const tsOut = resolve(root, "src/lib/tokens.ts");

const BANNER = "Generated from design-tokens/tokens.json. Do not edit.";

function* flatten(node, prefix = []) {
  for (const [key, value] of Object.entries(node)) {
    if (key.startsWith("$")) continue;
    const path = key === "DEFAULT" ? prefix : [...prefix, key];
    if (value && typeof value === "object") yield* flatten(value, path);
    else yield [path.join("-"), value];
  }
}

const tokens = JSON.parse(readFileSync(source, "utf8"));
const groups = Object.keys(tokens).filter((k) => !k.startsWith("$"));

const flat = {};
const cssLines = [`/* ${BANNER} */`, ":root {"];
for (const group of groups) {
  cssLines.push(`  /* ${group} */`);
  for (const [name, value] of flatten({ [group]: tokens[group] })) {
    cssLines.push(`  --${name}: ${value};`);
    flat[name] = value;
  }
  cssLines.push("");
}
cssLines.push("}");
const css = cssLines.join("\n") + "\n";

const ts =
  [
    `// ${BANNER}`,
    "export const tokens = {",
    ...Object.entries(flat).map(([name, value]) => `  "${name}": "${value}",`),
    "} as const;",
    "",
    "export type TokenName = keyof typeof tokens;",
    "",
    "/** Reference a token as a CSS variable. Use this instead of a literal value. */",
    "export function token(name: TokenName): string {",
    "  return `var(--${name})`;",
    "}",
  ].join("\n") + "\n";

const check = process.argv.includes("--check");
const stale = [];
for (const [path, next] of [
  [cssOut, css],
  [tsOut, ts],
]) {
  let current = null;
  try {
    current = readFileSync(path, "utf8");
  } catch {
    /* not generated yet */
  }
  if (current === next) continue;
  if (check) stale.push(path);
  else writeFileSync(path, next);
}

if (check && stale.length) {
  console.error(
    `Design tokens are stale. Run \`npm run tokens\` and commit:\n  ${stale.join("\n  ")}`,
  );
  process.exit(1);
}

console.log(
  check
    ? "tokens up to date"
    : `generated ${Object.keys(flat).length} tokens -> tokens.css, tokens.ts`,
);
