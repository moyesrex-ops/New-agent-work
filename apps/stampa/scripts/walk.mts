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
import { execFileSync, spawn, type ChildProcess } from "node:child_process";
import { appendFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { chromium, type Browser, type BrowserContext, type Page } from "playwright-core";

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

/**
 * Browser text scaling, as a multiple of the 16px default root. WCAG 1.4.4 asks
 * for 200% without loss of content, so WALK_TEXT_SCALE=2 is the interesting run.
 */
const TEXT_SCALE = Number(process.env.WALK_TEXT_SCALE ?? 1);

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
    // "Failed to load resource: 404" names nothing. The response listener
    // below reports the same failure with the URL attached, and it knows which
    // ones are Turbopack probing for a hot update.
    if (/^Failed to load resource/.test(text)) return;
    fail(label(), `console error: ${text.slice(0, 200)}`);
  });
  page.on("response", (response) => {
    if (response.status() < 400) return;
    const url = response.url();
    // Turbopack's HMR probe 404s by design between rebuilds.
    if (/\/_next\/static\/(chunks\/)?.*\.hot-update\./.test(url)) return;
    const kind = response.request().isNavigationRequest() ? "page" : "resource";
    fail(label(), `HTTP ${response.status()} on ${kind} ${url.replace(BASE, "")}`);
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
  await scaleText(page);
  const found = await page.evaluate((minimum) => {
    // The transpiler wraps named functions in a keepNames helper that only
    // exists in Node. This body runs in the page, so supply a no-op.
    const scope = globalThis as unknown as { __name?: (fn: unknown) => unknown };
    scope.__name ??= (fn: unknown) => fn;

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

    // Text that does not meet WCAG AA against what is actually behind it.
    // Computed from rendered colours rather than from the token table, because
    // the token table cannot see which surface a component was dropped onto.
    const parse = (value: string): [number, number, number, number] | null => {
      const parts = value.match(/[\d.]+/g);
      if (!parts || parts.length < 3) return null;
      return [Number(parts[0]), Number(parts[1]), Number(parts[2]), parts[3] ? Number(parts[3]) : 1];
    };

    const channel = (value: number): number => {
      const ratio = value / 255;
      return ratio <= 0.03928 ? ratio / 12.92 : ((ratio + 0.055) / 1.055) ** 2.4;
    };

    const luminance = (rgb: [number, number, number]): number =>
      0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2]);

    /** The colour actually painted behind an element, compositing any alpha. */
    const behind = (node: HTMLElement): [number, number, number] => {
      let layer: HTMLElement | null = node;
      let result: [number, number, number] = [255, 255, 255];
      const stack: [number, number, number, number][] = [];
      while (layer) {
        const style = getComputedStyle(layer);
        // A gradient is not a flat colour; keep walking to whatever it fades
        // into rather than guessing a midpoint.
        if (style.backgroundImage === "none") {
          const colour = parse(style.backgroundColor);
          if (colour && colour[3] > 0) {
            stack.push(colour);
            if (colour[3] === 1) break;
          }
        }
        layer = layer.parentElement;
      }
      for (const [r, g, b, a] of stack.reverse()) {
        result = [
          a * r + (1 - a) * result[0],
          a * g + (1 - a) * result[1],
          a * b + (1 - a) * result[2],
        ];
      }
      return result;
    };

    for (const node of document.querySelectorAll<HTMLElement>("body *")) {
      const text = [...node.childNodes]
        .filter((child) => child.nodeType === Node.TEXT_NODE)
        .map((child) => child.textContent ?? "")
        .join("")
        .trim();
      if (!text) continue;

      const style = getComputedStyle(node);
      if (style.visibility === "hidden" || style.display === "none") continue;
      if (Number(style.opacity) === 0) continue;
      const box = node.getBoundingClientRect();
      if (box.width === 0 || box.height === 0) continue;

      const foreground = parse(style.color);
      if (!foreground) continue;
      const background = behind(node);
      const front: [number, number, number] = [
        foreground[3] * foreground[0] + (1 - foreground[3]) * background[0],
        foreground[3] * foreground[1] + (1 - foreground[3]) * background[1],
        foreground[3] * foreground[2] + (1 - foreground[3]) * background[2],
      ];

      const light = luminance(front);
      const dark = luminance(background);
      const ratio =
        (Math.max(light, dark) + 0.05) / (Math.min(light, dark) + 0.05);

      const size = parseFloat(style.fontSize);
      const bold = Number(style.fontWeight) >= 700;
      const large = size >= 24 || (size >= 18.66 && bold);
      const required = large ? 3 : 4.5;

      if (ratio + 0.01 < required) {
        out.push(
          `contrast ${ratio.toFixed(2)}:1 < ${required}: "${text.slice(0, 24)}" (${style.color} on rgb(${background.map(Math.round).join(", ")}))`,
        );
      }
    }

    return out;
  }, floor);

  for (const problem of found) fail(where, problem);
  if (!found.length) pass(where);
}

/**
 * Tab through a screen the way somebody who cannot use a mouse has to. Checks
 * that every stop draws a focus ring, that the ring is on screen, and that the
 * order does not trap or stall.
 */
async function keyboard(page: Page, where: string, steps = 30): Promise<void> {
  const problems: string[] = [];
  const order: string[] = [];
  await page.evaluate("document.activeElement && document.activeElement.blur()");

  for (let step = 0; step < steps; step += 1) {
    await page.keyboard.press("Tab");
    const stop = await page.evaluate(() => {
      const node = document.activeElement as HTMLElement | null;
      if (!node || node === document.body || node === document.documentElement) return null;
      // The dev-tools overlay is a tab stop in development and ships in no
      // build a user ever sees.
      if (node.tagName.toLowerCase() === "nextjs-portal") return { skip: true } as const;
      const style = getComputedStyle(node);
      const box = node.getBoundingClientRect();
      return {
        label:
          node.getAttribute("aria-label") ||
          node.textContent?.trim().slice(0, 30) ||
          node.getAttribute("name") ||
          node.tagName.toLowerCase(),
        ring: style.outlineStyle !== "none" && parseFloat(style.outlineWidth) > 0,
        onScreen:
          box.width > 0 &&
          box.height > 0 &&
          box.bottom > 0 &&
          box.top < window.innerHeight &&
          box.right > 0 &&
          box.left < window.innerWidth,
      };
    });

    // Focus left the document for the browser chrome; the cycle is complete.
    if (!stop) break;
    if ("skip" in stop) continue;
    if (!stop.ring) problems.push(`no focus ring on "${stop.label}"`);
    if (!stop.onScreen) problems.push(`focus is off screen on "${stop.label}"`);
    if (order.length && order[order.length - 1] === stop.label && order.length > 1) {
      problems.push(`focus stuck on "${stop.label}"`);
      break;
    }
    order.push(stop.label);
  }

  if (!order.length) problems.push("nothing is reachable by keyboard");
  for (const problem of problems) fail(where, problem);
  if (!problems.length) pass(`${where} by keyboard, ${order.length} stops`);
}

async function visit(page: Page, path: string, name: string, floor?: number): Promise<void> {
  await go(page, path);
  await audit(page, `${name} (${path})`, floor);
  await shot(page, name);
}

/** A context at one viewport, with the requested browser text scaling applied. */
async function open(
  browser: Browser,
  viewport: { width: number; height: number },
  deviceScaleFactor?: number,
): Promise<BrowserContext> {
  return browser.newContext({ viewport, deviceScaleFactor });
}

/**
 * Enlarge the root font the way a browser's text-size setting does. This runs
 * after hydration, because touching <html> before React attaches makes it
 * complain about a server/client mismatch that no real user would ever hit.
 */
async function scaleText(page: Page): Promise<void> {
  if (TEXT_SCALE === 1) return;
  await page.evaluate(`(function () {
    var id = "walk-text-scale";
    if (document.getElementById(id)) return;
    var style = document.createElement("style");
    style.id = id;
    style.textContent = "html{font-size:${16 * TEXT_SCALE}px}";
    document.body.appendChild(style);
  })();`);
}

/** Phone, code, in. The OTP is read back out of the dev messenger's log line. */
async function signIn(page: Page, phone: string, lands: RegExp): Promise<void> {
  await go(page, "/s/start");
  await page.getByLabel(/phone number/i).fill(phone);
  await submit(page, /send code/i, /\/s\/code/);
  const code = await waitForLog(/\[dev\] OTP for [^:]+: (\d{6})/g, "an OTP");
  await page.getByLabel(/6-digit code/i).fill(code);
  await submit(page, /continue/i, lands);
}

async function supplier(browser: Browser): Promise<void> {
  console.log("\nSupplier app, 360x740");
  const context = await open(browser, PHONE, 2);
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
  await keyboard(page, where);

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
    ["/s/account/delete", "s15-delete"],
    ["/s/help", "s13-help"],
  ] as const) {
    where = name;
    await visit(page, path, name);
  }

  // A code that was never issued. This is where a supplier lands when someone
  // mistypes a link read off a WhatsApp forward, and it has to be a dead end
  // with a phone number on it rather than a framework 404.
  where = "S1 invite, invalid code";
  await visit(page, "/s/i/AGB-0000", "s1-invite-invalid");
  if (!(await page.getByText(/not active/i).count())) {
    fail(where, "an unknown invite code does not say the link is not active");
  }
  if (!(await page.locator('a[href^="tel:"]').count())) {
    fail(where, "a dead-end invite screen offers no phone number");
  }

  await context.close();
}

/**
 * The three ways an invoice fails, walked as the supplier who owns them.
 *
 * S10 is the screen the whole trust argument rests on: a supplier who thinks a
 * rejection means they did something wrong, or that their money is gone, does
 * not come back. All three variants are seeded onto one supplier so one
 * sign-in reaches them, and the assertions are set-wise rather than
 * positional, because list order is a function of seeded timestamps.
 */
async function failures(browser: Browser): Promise<void> {
  console.log("\nRejections, 360x740");
  const context = await open(browser, PHONE, 2);
  const page = await context.newPage();
  let where = "rejections";
  watch(page, () => where);

  // A supplier already onboarded, with months of history behind them.
  await signIn(page, "08030000002", /\/s(\?|$)/);

  where = "S5 home, full history";
  await audit(page, where);
  await shot(page, "s5-home-history");

  const rejected = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLAnchorElement>('a[href^="/s/invoice/"]')]
      .filter((row) => /not stamped/i.test(row.textContent ?? ""))
      .map((row) => row.getAttribute("href") ?? ""),
  );

  if (rejected.length !== 3) {
    fail(where, `expected 3 rejected invoices in the seeded history, found ${rejected.length}`);
  }

  // Each variant says a different thing, and saying the wrong one to the wrong
  // supplier is the failure mode: telling someone to fix an invoice that is
  // not theirs to fix, or telling them to wait when they could fix it now.
  const VARIANTS = [
    ["supplier fault", /check the amounts, then send again/i],
    ["buyer fault", /on your customer's side, not yours/i],
    ["nobody's fault", /case \d{4}/i],
  ] as const;
  const seen = new Set<string>();

  for (const [index, href] of rejected.entries()) {
    where = `S10 rejection ${index + 1}`;
    await go(page, href);
    await audit(page, where);
    await shot(page, `s10-rejected-${index + 1}`);

    for (const [name, pattern] of VARIANTS) {
      if (await page.getByText(pattern).count()) seen.add(name);
    }

    // Whatever the cause, the invoice is not lost. This line is the one thing
    // all three variants must carry.
    if (!(await page.getByText(/your invoice is saved/i).count())) {
      fail(where, "a rejection screen does not say the invoice is saved");
    }
  }

  for (const [name] of VARIANTS) {
    if (!seen.has(name)) fail("S10 rejections", `the "${name}" variant was never rendered`);
  }

  // Recovery. The supplier-fixable rejection is the only one with something to
  // do, and "Edit invoice" has to mean edit: arriving at an empty form after
  // being told the NRS said no is how a supplier decides the product is more
  // trouble than the buyer's threat.
  where = "S10 recovery";
  await go(page, "/s");
  const fixable = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLAnchorElement>('a[href^="/s/invoice/"]')]
      .filter((row) => /not stamped/i.test(row.textContent ?? ""))
      .map((row) => row.getAttribute("href") ?? ""),
  );

  for (const href of fixable) {
    await go(page, href);
    if (!(await page.getByRole("link", { name: /edit invoice/i }).count())) continue;

    await page.getByRole("link", { name: /edit invoice/i }).first().click();
    await page.waitForURL(/\/s\/new\?from=/, { timeout: 20_000 });
    await audit(page, where);
    await shot(page, "s6-new-prefilled");

    const description = await page.getByLabel(/what did you supply/i).inputValue();
    const price = await page.getByLabel(/price each/i).inputValue();
    if (!description.trim()) fail(where, "the description was not carried over from the rejection");
    if (!price.trim() || price === "0.00") {
      fail(where, "the price was not carried over from the rejection");
    }
    break;
  }

  // Raw kobo must never reach a supplier. A VAT mismatch arrives from the
  // gateway as an integer and 1020000 is not a number anybody recognises as
  // their own VAT figure.
  where = "S10 offending value";
  for (const href of rejected) {
    await go(page, href);
    const raw = await page.locator("body").innerText();
    const bare = raw.match(/\n\s*(\d{6,})\s*\n/);
    if (bare) fail(where, `an unformatted number is on screen: ${bare[1]}`);
  }

  await context.close();
}

async function buyer(browser: Browser): Promise<void> {
  console.log("\nBuyer console, 1366x768");
  const context = await open(browser, LAPTOP);
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
    ["/c/exposure", "b5-exposure"],
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
    if (name === "b6-suppliers") await keyboard(page, where);
  }

  // B5 is the screenshot that gets forwarded to a Financial Controller, so it
  // carries two obligations the other console screens do not: the money is
  // formatted the way money is formatted everywhere else, and the number is
  // sourced on the same page rather than asserted.
  where = "B5 exposure report";
  await go(page, "/c/exposure");
  if (!(await page.getByText(/^NGN [\d,]+\.\d{2}$/).count())) {
    fail(where, "the headline figure is not rendered as a formatted naira amount");
  }
  if (!(await page.getByText(/based on \d+ vendors uploaded on/i).count())) {
    fail(where, "the exposure figure has no method line — it cannot be sourced");
  }

  where = "B6 supplier detail";
  await go(page, "/c/suppliers");
  const first = page.locator('table a[href^="/c/suppliers/"]').first();
  if (!(await first.count())) {
    fail(where, "the supplier list has no rows to open");
  } else {
    await first.click();
    // Not networkidle: it resolves on the page we came from, which is how the
    // first version of this audited the list twice and reported the detail
    // screen as walked.
    await page.waitForURL(/\/c\/suppliers\/[^/]+$/, { timeout: 20_000 });
    await page.waitForLoadState("networkidle");
    await audit(page, where, TARGET_FLOOR.laptop);
    await shot(page, "b6-supplier-detail");

    if (!(await page.getByRole("link", { name: /back to suppliers/i }).count())) {
      fail(where, "no way back to the list from a supplier record");
    }
  }

  await context.close();
}

async function operator(browser: Browser): Promise<void> {
  console.log("\nOperator console, 1366x768");
  const context = await open(browser, LAPTOP);
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
    if (name === "o3-failures") await keyboard(page, where);
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

  // A walk that was interrupted mid-run (piping this output into `head` is
  // enough) leaves its server holding the port. Reclaim it rather than failing
  // the next run with an EADDRINUSE that looks like an app defect.
  try {
    execFileSync("sh", ["-c", `lsof -ti tcp:${PORT} | xargs -r kill -9`], { stdio: "ignore" });
    await new Promise((done) => setTimeout(done, 500));
  } catch {
    // No lsof, or nothing was listening. Either way the bind below decides.
  }

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
    await failures(browser);
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
