/**
 * Scripted browser walk of all three surfaces (release test RT-01).
 *
 * This exists because the alternative is trusting that the screens still
 * render. Unit tests cover the money path against a real Postgres, but nothing
 * they assert would have caught the bundler handing PGlite a URL where it
 * wanted a path — which took the invite landing page, the first screen any
 * supplier ever sees, to a 500 while every test stayed green.
 *
 * It fails on: any non-2xx document response, any uncaught page error, any
 * console error, and any assertion below. Screenshots land in .walk/ for
 * eyeballing, at the two viewports the product actually has to survive.
 *
 *   npm run walk           headless, exits non-zero on any problem
 *   npm run walk -- --keep leaves the browser data for inspection
 */
import { spawn, type ChildProcess } from "node:child_process";
import { appendFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { chromium, type Browser, type Page } from "playwright-core";

/**
 * The walk provisions its own world.
 *
 * Sharing the development database made it pass once and then fail on the
 * second run, because the supplier was already onboarded and the OTP rate
 * limiter — correctly — refused a fourth code in fifteen minutes. A release
 * test that only works the first time is not one.
 */
const PORT = Number(process.env.WALK_PORT ?? 3411);
const OWN_SERVER = !process.env.WALK_BASE_URL;
const BASE = process.env.WALK_BASE_URL ?? `http://localhost:${PORT}`;
const SHOTS = resolve(process.cwd(), ".walk");
const LOG = process.env.WALK_SERVER_LOG ?? resolve(SHOTS, "server.log");
const DATA = resolve(process.cwd(), ".data/walk");

/** A cheap Android in portrait, and the AP clerk's laptop. */
const PHONE = { width: 360, height: 740 };
const LAPTOP = { width: 1366, height: 768 };

const problems: string[] = [];
let step = 0;

function fail(where: string, detail: string): void {
  problems.push(`${where}: ${detail}`);
  console.error(`  ✗ ${where}: ${detail}`);
}

function pass(what: string): void {
  console.log(`  ✓ ${what}`);
}

/** Screenshots are numbered so the sequence reads as the journey it walked. */
async function shot(page: Page, name: string): Promise<void> {
  step += 1;
  await page.screenshot({
    path: resolve(SHOTS, `${String(step).padStart(2, "0")}-${name}.png`),
    fullPage: true,
  });
}

/**
 * Watch for the failures a human notices immediately and an assertion never
 * thinks to check: a 500, a hydration error, a red console line.
 */
function watch(page: Page, label: () => string): void {
  page.on("pageerror", (error) => fail(label(), `uncaught: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const text = message.text();
    // React's dev-only "Download the React DevTools" and Next's HMR chatter
    // are not defects.
    if (/DevTools|Fast Refresh|hydrat.*extension/i.test(text)) return;
    fail(label(), `console error: ${text.slice(0, 200)}`);
  });
  page.on("response", (response) => {
    if (!response.request().isNavigationRequest()) return;
    if (response.status() >= 400) fail(label(), `HTTP ${response.status()} on ${response.url()}`);
  });
}

async function go(page: Page, path: string): Promise<void> {
  await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
}

/**
 * Click, then wait for the screen to actually change.
 *
 * A server action is a fetch followed by a redirect, so `networkidle` can
 * resolve while the page is still the old one — which is how the first version
 * of this script silently audited the same screen four times and declared the
 * flow walked.
 */
async function submit(page: Page, name: RegExp | string, expect: RegExp): Promise<void> {
  const before = page.url();
  await page.getByRole("button", { name }).first().click();
  await page.waitForURL(expect, { timeout: 20_000 }).catch(() => {
    throw new Error(`clicking ${name} on ${before} never reached ${expect}`);
  });
  await page.waitForLoadState("networkidle");
}

/** The dev messenger prints codes and links to the server log. */
function fromLog(pattern: RegExp): string | null {
  let text: string;
  try {
    text = readFileSync(LOG, "utf8");
  } catch {
    return null;
  }
  const matches = [...text.matchAll(pattern)];
  return matches.at(-1)?.[1] ?? null;
}

async function waitForLog(pattern: RegExp, what: string): Promise<string> {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const found = fromLog(pattern);
    if (found) return found;
    await new Promise((done) => setTimeout(done, 250));
  }
  throw new Error(`never saw ${what} in ${LOG}`);
}

/**
 * Structural checks every screen must pass, run on all of them rather than
 * remembered per screen. Text overflowing its box at 360px is the defect this
 * product is most likely to ship, because it is invisible on a developer's
 * monitor.
 */
/**
 * The floors are the ones the UX package actually specifies, not one number
 * applied everywhere: 48px in the supplier app because it is used one-handed
 * on a bus, 40px in the consoles because they are used with a mouse and a
 * denser grid is the right trade there.
 */
const TARGET_FLOOR: { phone: number; laptop: number } = { phone: 48, laptop: 40 };

async function audit(page: Page, where: string, floor = TARGET_FLOOR.phone): Promise<void> {
  const found = await page.evaluate((minimum) => {
    const out: string[] = [];

    // One h1, and it is not empty. A screen with no heading is a screen a
    // screen-reader user cannot orient in.
    const headings = [...document.querySelectorAll("h1")];
    if (headings.length === 0) out.push("no h1");
    if (headings.length > 1) out.push(`${headings.length} h1 elements`);
    if (headings.some((heading) => !heading.textContent?.trim())) out.push("empty h1");

    // Anything wider than the viewport means a horizontal scrollbar on a
    // phone, which is the classic unfinished-product tell.
    if (document.documentElement.scrollWidth > window.innerWidth + 1) {
      const wide = [...document.querySelectorAll<HTMLElement>("body *")]
        .filter((node) => node.getBoundingClientRect().right > window.innerWidth + 1)
        .slice(0, 3)
        .map((node) => `${node.tagName.toLowerCase()}.${node.className || "?"}`.slice(0, 60));
      out.push(`overflows viewport (${wide.join(", ") || "unknown"})`);
    }

    for (const control of document.querySelectorAll<HTMLElement>(
      "button, a[href], input:not([type=hidden]), select",
    )) {
      // A checkbox inside a label is hit by clicking anywhere on the label, so
      // the row is the target, not the 20px box drawn inside it.
      const target = control.closest("label") ?? control;
      const box = target.getBoundingClientRect();
      if (box.width === 0 && box.height === 0) continue;
      // Inline links inside a sentence are exempt: they inherit line height
      // and enlarging them would break the paragraph.
      const inline = control.tagName === "A" && getComputedStyle(control).display === "inline";
      if (!inline && box.height < minimum) {
        out.push(
          `target ${Math.round(box.height)}px < ${minimum}: ${control.textContent?.trim().slice(0, 30) || control.getAttribute("aria-label") || control.tagName}`,
        );
      }
    }

    // A form control with no accessible name.
    for (const field of document.querySelectorAll<HTMLElement>(
      "input:not([type=hidden]), select, textarea",
    )) {
      const id = field.getAttribute("id");
      const labelled =
        field.getAttribute("aria-label") ||
        field.getAttribute("aria-labelledby") ||
        field.closest("label") ||
        (id && document.querySelector(`label[for="${id}"]`));
      if (!labelled) out.push(`unlabelled field: ${field.getAttribute("name") ?? field.tagName}`);
    }

    // Two text runs touching with no gap. This is how "To" and "Agbara Foods
    // Plc" rendered as "ToAgbara Foods Plc" on the review screen — invisible
    // to every test and the first thing a human sees.
    for (const parent of document.querySelectorAll<HTMLElement>("body *")) {
      const children = [...parent.children].filter(
        (child): child is HTMLElement =>
          child instanceof HTMLElement && Boolean(child.textContent?.trim()),
      );
      for (let i = 0; i + 1 < children.length; i += 1) {
        // Table cells sit flush against each other by design; the padding
        // inside them is what separates the text. Only inline runs count.
        const leftDisplay = getComputedStyle(children[i]).display;
        const rightDisplay = getComputedStyle(children[i + 1]).display;
        if (!leftDisplay.startsWith("inline") || !rightDisplay.startsWith("inline")) continue;

        const left = children[i].getBoundingClientRect();
        const right = children[i + 1].getBoundingClientRect();
        const sameLine = Math.abs(left.top - right.top) < 4 && left.height > 0;
        const touching = right.left - left.right >= 0 && right.left - left.right < 1.5;
        // A separator character between them is intentional punctuation.
        const between = children[i].nextSibling;
        const spaced = between?.nodeType === Node.TEXT_NODE && /\s/.test(between.textContent ?? "");
        if (sameLine && touching && !spaced) {
          out.push(
            `text runs touching: "${children[i].textContent?.trim().slice(0, 20)}" + "${children[i + 1].textContent?.trim().slice(0, 20)}"`,
          );
        }
      }
    }

    // An image with no intrinsic size stretches. Phase 10 shipped that once.
    for (const image of document.querySelectorAll("img")) {
      if (!image.getAttribute("width") || !image.getAttribute("height")) {
        out.push(`img without width/height: ${image.getAttribute("src")?.slice(0, 40)}`);
      }
    }

    return out;
  }, floor);

  for (const problem of found) fail(where, problem);
  if (!found.length) pass(where);
}

async function visit(page: Page, path: string, name: string, floor?: number): Promise<void> {
  await go(page, path);
  await audit(page, `${name} (${path})`, floor);
  await shot(page, name);
}

async function supplier(browser: Browser): Promise<void> {
  console.log("\nSupplier app, 360x740");
  const context = await browser.newContext({ viewport: PHONE, deviceScaleFactor: 2 });
  const page = await context.newPage();
  let where = "supplier";
  watch(page, () => where);

  where = "S1 invite";
  await go(page, "/s/i/AGB-4471");
  await audit(page, where);
  await shot(page, "s1-invite");

  if (!(await page.getByText(/free for suppliers/i).count())) {
    fail(where, "the free-for-suppliers promise is missing from the first screen");
  }

  await submit(page, /get started/i, /\/s\/start/);

  where = "S2 phone";
  await audit(page, where);
  await shot(page, "s2-phone");

  await page.getByLabel(/phone number/i).fill("08030000001");
  await submit(page, /send code/i, /\/s\/code/);

  where = "S3 code";
  await audit(page, where);
  const code = await waitForLog(/\[dev\] OTP for [^:]+: (\d{6})/g, "an OTP");
  await shot(page, "s3-code");

  await page.getByLabel(/6-digit code/i).fill(code);
  await submit(page, /continue/i, /\/s\/confirm/);

  where = "S4 confirm business";
  await audit(page, where);
  await shot(page, "s4-confirm");

  // Test plan AT-03. The claim the product is built on is that the supplier
  // types neither their own TIN nor their customer's, so this screen must
  // arrive already filled in. Editable is fine; blank is not.
  const tin = await page.locator('input[name="tin"]').inputValue();
  if (!tin.trim()) fail(where, "TIN is blank — the supplier is being asked to type it");

  // The bank row cannot be a field at all, on any screen, ever.
  if (await page.locator('input[name*="bank" i]').count()) {
    fail(where, "a bank field is editable — this is the payment-diversion attack");
  }

  // Confirming lands on the new-invoice screen, not the (empty) home list.
  // Ninety seconds is the promise, and a home screen in the middle of it is a
  // stop the supplier has no reason to make.
  await submit(page, /this is correct/i, /\/s\/new/);

  where = "S5 home";
  await go(page, "/s");
  await audit(page, where);
  await shot(page, "s5-home");

  where = "S5 home, searched";
  await go(page, "/s?q=cartons");
  await audit(page, where);
  await shot(page, "s5-home-search");

  where = "S5 home, search with no match";
  await go(page, "/s?q=zzzz");
  await audit(page, where);
  if (!(await page.getByText(/nothing matches/i).count())) {
    fail(where, "an empty search result does not say why it is empty");
  }
  await shot(page, "s5-home-nomatch");

  where = "S6 new invoice";
  await go(page, "/s/new");
  await audit(page, where);
  await shot(page, "s6-new");

  await page.getByLabel(/what did you supply/i).fill("Roofing sheets, 0.55mm");
  await page.getByLabel(/quantity/i).fill("120");
  await page.getByLabel(/price each/i).fill("18500");
  await submit(page, /^review$/i, /\/review/);

  where = "S7 review";
  await audit(page, where);
  await shot(page, "s7-review");

  // 120 × ₦18,500 = ₦2,220,000, +7.5% VAT = ₦2,386,500. Hard-coded on purpose:
  // a rounding regression in the money path has to fail this walk, not just
  // the unit tests, because this is the number the supplier reads.
  if (!(await page.getByText("2,386,500").count())) {
    fail(where, "the VAT-inclusive total ₦2,386,500 is not on the review screen");
  }

  await submit(page, /send to nrs/i, /\/s\/invoice\//);
  await page.waitForTimeout(2500);

  where = "S8/S9 outcome";
  await audit(page, where);
  await shot(page, "s8-outcome");

  for (const [path, name] of [
    ["/s/account", "s14-account"],
    ["/s/help", "s13-help"],
  ] as const) {
    where = name;
    await visit(page, path, name);
  }

  await context.close();
}

async function buyer(browser: Browser): Promise<void> {
  console.log("\nBuyer console, 1366x768");
  const context = await browser.newContext({ viewport: LAPTOP });
  const page = await context.newPage();
  let where = "buyer";
  watch(page, () => where);

  where = "B1 sign in";
  await go(page, "/c/signin");
  await audit(page, where, TARGET_FLOOR.laptop);
  await shot(page, "b1-signin");

  await page.getByLabel(/email/i).fill("tax.manager@agbarafoods.com");
  await page.getByRole("button", { name: /send|link/i }).first().click();
  await page.waitForLoadState("networkidle");

  const link = await waitForLog(/\[dev\] email to [^:]+: [\s\S]*?(http:\/\/\S*\/c\/signin\/\S+)/g, "a magic link");
  await page.goto(link.trim(), { waitUntil: "networkidle" });

  for (const [path, name] of [
    ["/c", "b2-overview"],
    ["/c/suppliers", "b6-suppliers"],
    ["/c/suppliers?status=live", "b6-suppliers-live"],
    ["/c/suppliers?q=emeka", "b6-suppliers-search"],
    ["/c/invite", "b7-invite"],
    ["/c/invoices", "b8-inbound"],
    ["/c/upload", "b3-upload"],
    ["/c/settings", "b9-settings"],
  ] as const) {
    where = name;
    await visit(page, path, name, TARGET_FLOOR.laptop);
  }

  where = "B6 supplier detail";
  await go(page, "/c/suppliers");
  const first = page.locator("table a").first();
  if (await first.count()) {
    await first.click();
    await page.waitForLoadState("networkidle");
    await audit(page, where, TARGET_FLOOR.laptop);
    await shot(page, "b6-supplier-detail");
  } else {
    fail(where, "the supplier list has no rows to open");
  }

  await context.close();
}

async function operator(browser: Browser): Promise<void> {
  console.log("\nOperator console, 1366x768");
  const context = await browser.newContext({ viewport: LAPTOP });
  const page = await context.newPage();
  let where = "operator";
  watch(page, () => where);

  where = "O1 sign in";
  await go(page, "/ops/signin");
  await audit(page, where, TARGET_FLOOR.laptop);
  await shot(page, "o1-signin");

  await page.getByLabel(/email/i).fill("ops@stampa.ng");
  await page.getByRole("button", { name: /send|link/i }).first().click();
  await page.waitForLoadState("networkidle");

  const link = await waitForLog(
    /\[dev\] email to [^:]+: [\s\S]*?(http:\/\/\S*\/ops\/signin\/\S+)/g,
    "an operator magic link",
  );
  await page.goto(link.trim(), { waitUntil: "networkidle" });

  for (const [path, name] of [
    ["/ops", "o2-metrics"],
    ["/ops/failures", "o3-failures"],
    ["/ops/lookup?q=emeka", "o4-lookup"],
    ["/ops/flags", "o5-flags"],
    ["/ops/audit", "o6-audit"],
  ] as const) {
    where = name;
    await visit(page, path, name, TARGET_FLOOR.laptop);
  }

  await context.close();
}

function run(command: string, args: string[], env: Record<string, string>): Promise<void> {
  return new Promise((done, broken) => {
    const child = spawn(command, args, { env: { ...process.env, ...env }, stdio: "inherit" });
    child.on("exit", (code) => (code === 0 ? done() : broken(new Error(`${command} exited ${code}`))));
  });
}

async function startServer(): Promise<ChildProcess> {
  rmSync(DATA, { recursive: true, force: true });
  writeFileSync(LOG, "");

  const env = {
    NEXT_DIST_DIR: ".next-walk",
    DATABASE_URL: `pglite://${DATA}`,
    // No artificial latency: the walk waits on real transitions, and 1200ms
    // per transmission is thirty wasted seconds across the journey.
    STAMPA_FAKE_LATENCY_MS: "0",
    STAMPA_OPERATORS: "ops@stampa.ng",
    APP_URL: BASE,
    OTP_PEPPER: "walk-pepper-of-at-least-thirty-two-characters",
  };

  console.log("seeding a fresh database");
  await run("npx", ["tsx", "scripts/seed.mts"], env);

  console.log(`starting the app on ${BASE}`);
  // Detached, so teardown can signal the whole group. `npx next dev` spawns a
  // child that survives a SIGTERM to npx alone, and the orphan then holds the
  // port against the next run.
  const server = spawn("npx", ["next", "dev", "-p", String(PORT)], {
    env: { ...process.env, ...env },
    detached: true,
  });
  const record = (chunk: Buffer) => appendFileSync(LOG, chunk.toString());
  server.stdout?.on("data", record);
  server.stderr?.on("data", record);

  for (let attempt = 0; attempt < 120; attempt += 1) {
    await new Promise((done) => setTimeout(done, 500));
    if (server.exitCode !== null) break;
    const alive = await fetch(`${BASE}/s/help`).then((response) => response.ok).catch(() => false);
    if (alive) return server;
  }

  stopServer(server);
  throw new Error(`the app never came up on ${BASE}. See ${LOG}`);
}

function stopServer(server: ChildProcess | null): void {
  if (!server?.pid) return;
  try {
    process.kill(-server.pid, "SIGTERM");
  } catch {
    server.kill("SIGTERM");
  }
}

async function main(): Promise<void> {
  rmSync(SHOTS, { recursive: true, force: true });
  mkdirSync(SHOTS, { recursive: true });

  const server = OWN_SERVER ? await startServer() : null;
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH ?? "/usr/local/bin/google-chrome",
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });

  try {
    await supplier(browser);
    await buyer(browser);
    await operator(browser);
  } finally {
    await browser.close();
    stopServer(server);
  }

  console.log(`\n${step} screens, screenshots in .walk/`);
  if (problems.length) {
    console.error(`\n${problems.length} problems:\n  ${problems.join("\n  ")}`);
    process.exit(1);
  }
  console.log("no problems");
  process.exit(0);
}

await main();
