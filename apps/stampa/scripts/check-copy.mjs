/**
 * Enforces the copy rules from the brand voice charter and the test plan.
 *
 * Three checks, all of which were previously "a reviewer will notice":
 *
 *   BT-06  Customer-facing screens read their words from src/lib/copy.ts,
 *          so the deck can be diffed against the product and so v2 can be
 *          translated without hunting through JSX.
 *   BT-07  No banned word reaches a user, including an exclamation mark in a
 *          transactional string.
 *   §8.2   Sentences stay short enough to survive being read aloud in Pidgin
 *          by a support agent on the phone.
 *
 * The boundary is deliberate and narrow. /s and /c are read by suppliers and
 * by paying customers; /ops is read by two founders who can also read the
 * source. Applying the rule where it does not earn its keep is how rules get
 * suspended everywhere.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const COPY = resolve(root, "src/lib/copy.ts");
const GOVERNED = ["src/app/s", "src/app/c", "src/components"];

/** From the voice charter §8.2. */
const BANNED = [
  "seamless",
  "robust",
  "leverage",
  "empower",
  "unlock",
  "revolutionise",
  "revolutionize",
  "solution",
  "simply",
  "easy",
  "oops",
  "uh oh",
  "whoops",
  "utilise",
  "utilize",
];

/** Words per sentence. The console ceiling from the voice charter §8.2. */
const SENTENCE_CEILING = 20;

const problems = [];

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) out.push(...walk(path));
    else if (/\.tsx?$/.test(path)) out.push(path);
  }
  return out;
}

/**
 * Strip everything that is not a user-visible string: comments carry
 * reasoning, imports carry paths, and both legitimately contain prose.
 */
function withoutNoise(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "")
    .replace(/^\s*import[\s\S]*?from\s+["'].*?["'];?$/gm, "");
}

// ---- BT-06: no literal sentence in a governed component ----

for (const file of GOVERNED.flatMap((dir) => walk(resolve(root, dir)))) {
  const source = withoutNoise(readFileSync(file, "utf8"));
  const where = relative(root, file);

  // Text between JSX tags: >Some words here<
  for (const [, text] of source.matchAll(/>\s*([A-Z][a-z]+(?:\s+[A-Za-z,'’-]+){1,})\s*</g)) {
    problems.push(`${where}: literal in JSX — "${text.trim()}"`);
  }

  // Prose either side of an interpolation: >Call {phone}< and >{rate} is added
  // for you.<. The rule above cannot see these, and they are the ones most
  // likely to be written by hand, because the variable makes the line feel
  // dynamic enough not to belong in a catalogue.
  for (const [, text] of source.matchAll(/>\s*([A-Z][a-z]{2,}(?:\s+[a-z]+)*)\s+\{/g)) {
    problems.push(`${where}: literal before an expression — "${text.trim()} {…}"`);
  }
  // The closing tag is required: without it `}` followed by `export type Foo<T>`
  // reads as a sentence.
  for (const [, text] of source.matchAll(/\}[ \t]*([a-z][A-Za-z ,.'’\n\t-]{8,}?)<\//g)) {
    if (text.trim().split(/\s+/).length < 3) continue;
    problems.push(`${where}: literal after an expression — "{…} ${text.trim()}"`);
  }

  // Strings passed to props that render: label, heading, body, placeholder…
  const RENDERED =
    /\b(label|heading|body|placeholder|caption|title|hint|header|next|what|why|reassurance)=(?:["']([A-Z][^"']{3,})["']|\{`([^`]{4,})`\})/g;
  for (const [, prop, quoted, templated] of source.matchAll(RENDERED)) {
    const text = quoted ?? templated;
    // A template that is nothing but an interpolation is a value, not copy.
    if (!quoted && !/[A-Za-z]{3,}/.test(text.replace(/\$\{[^}]*\}/g, ""))) continue;
    problems.push(`${where}: literal in ${prop} — "${text}"`);
  }
}

// ---- BT-07 and §8.2, over the catalogue itself ----

const catalogue = readFileSync(COPY, "utf8");
const strings = [...withoutNoise(catalogue).matchAll(/["'`]([^"'`\n]{4,})["'`]/g)].map(
  ([, text]) => text,
);

for (const text of strings) {
  const lower = text.toLowerCase();

  for (const word of BANNED) {
    // Word boundaries, so "solution" is caught and "resolutions" is not.
    if (new RegExp(`\\b${word}\\b`).test(lower)) {
      problems.push(`copy.ts: banned word "${word}" in "${text.slice(0, 60)}"`);
    }
  }

  // "just" is banned as a minimiser but is ordinary English elsewhere; only
  // the minimising sense reads as an insult with a smile.
  if (/\bjust\b/.test(lower) && !/\bjust now\b/.test(lower)) {
    problems.push(`copy.ts: minimising "just" in "${text.slice(0, 60)}"`);
  }

  if (text.includes("!")) {
    problems.push(`copy.ts: exclamation mark in "${text.slice(0, 60)}"`);
  }

  // Grade 6, said out loud. The charter asks for 12 words in the supplier app
  // and allows 20 in the console; the catalogue mixes both, so the machine
  // enforces the looser of the two and the app strings are held to 12 by eye.
  // Measured per sentence, not per string, because a two-sentence paragraph is
  // fine and a 30-word sentence is not.
  for (const sentence of text.split(/(?<=[.?])\s+/)) {
    const words = sentence.trim().split(/\s+/).filter(Boolean);
    if (words.length > SENTENCE_CEILING) {
      problems.push(`copy.ts: ${words.length}-word sentence — "${sentence.slice(0, 70)}…"`);
    }
  }
}

if (problems.length) {
  console.error(`${problems.length} copy problems:\n  ${problems.join("\n  ")}`);
  process.exit(1);
}
console.log(`copy clean: ${strings.length} strings checked, ${GOVERNED.length} directories governed`);
