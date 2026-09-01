/**
 * Renders public/brand/* from the locked brand artwork in company/brand/logo.
 *
 * The app was shipping a 404 on its own favicon because public/ was empty and
 * the layout referenced files nobody had put there. Generating them means the
 * icon on a supplier's home screen cannot drift from the identity, and
 * `--check` makes that enforceable.
 *
 * Which variant goes where is the Phase 9 rule, not a preference: the full
 * mark never appears below 24px, so the favicon uses the simplified glyph and
 * the launcher icon uses the perforated one.
 */
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const brand = resolve(root, "../../company/brand/logo");
const out = resolve(root, "public/brand");

const VIOLET = "#4C2A85";

/**
 * Android masks a maskable icon to whatever shape the launcher prefers, and
 * crops up to 20% off each edge doing it. The app icon's own rounded corners
 * would be eaten, so this variant sits the mark on a full-bleed field at 60%
 * — inside the safe circle whatever shape the launcher picks.
 */
function maskableSvg() {
  const source = readFileSync(resolve(brand, "stampa-app-icon.svg"), "utf8");
  const inner = source.replace(/^[\s\S]*?<rect[^>]*\/>/, "").replace(/<\/svg>\s*$/, "");
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">`,
    `<rect width="1024" height="1024" fill="${VIOLET}"/>`,
    `<g transform="translate(205 205) scale(0.6)">${inner}</g>`,
    `</svg>`,
  ].join("");
}

function png(svgPath, size, target) {
  execFileSync("rsvg-convert", ["-w", String(size), "-h", String(size), "-o", target, svgPath]);
}

const check = process.argv.includes("--check");
const before = new Map();
try {
  for (const name of readdirSync(out)) {
    before.set(name, readFileSync(resolve(out, name)));
  }
} catch {
  /* not generated yet */
}

const staging = resolve(root, ".assets-tmp");
rmSync(staging, { recursive: true, force: true });
mkdirSync(staging, { recursive: true });

copyFileSync(resolve(brand, "stampa-favicon.svg"), resolve(staging, "favicon.svg"));
copyFileSync(resolve(brand, "stampa-app-icon.svg"), resolve(staging, "app-icon.svg"));
copyFileSync(resolve(brand, "stampa-mark-paper.svg"), resolve(staging, "mark-paper.svg"));

const maskablePath = resolve(staging, "maskable.svg");
writeFileSync(maskablePath, maskableSvg());

png(resolve(brand, "stampa-app-icon.svg"), 180, resolve(staging, "apple-touch-icon.png"));
png(resolve(brand, "stampa-app-icon.svg"), 192, resolve(staging, "icon-192.png"));
png(resolve(brand, "stampa-app-icon.svg"), 512, resolve(staging, "icon-512.png"));
png(maskablePath, 512, resolve(staging, "maskable-512.png"));
rmSync(maskablePath);

const produced = new Map();
for (const name of readdirSync(staging)) {
  produced.set(name, readFileSync(resolve(staging, name)));
}

const stale = [...produced].some(([name, body]) => !before.get(name)?.equals(body));
const removed = [...before.keys()].some((name) => !produced.has(name));

if (check) {
  rmSync(staging, { recursive: true, force: true });
  if (stale || removed) {
    console.error("public/brand is stale. Run `npm run assets` and commit.");
    process.exit(1);
  }
  console.log("brand assets up to date");
} else {
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  for (const [name, body] of produced) writeFileSync(resolve(out, name), body);
  rmSync(staging, { recursive: true, force: true });
  console.log(`wrote ${produced.size} files to public/brand`);
}
