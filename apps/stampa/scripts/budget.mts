/**
 * Measure the first-load payload against the budget in the architecture note:
 * 180KB of JavaScript and 40KB of CSS on the critical path, fonts off the
 * critical path, no images above the fold.
 *
 * This is a separate script from the walk because the walk runs `next dev`,
 * where bundles are unminified and split for hot reload. Measuring a payload
 * budget against a dev build tells you nothing. This one builds and serves the
 * production output.
 *
 *   npm run budget            measure and enforce
 *   npm run budget -- --json  emit the numbers for a report
 */
import { execFileSync, spawn, type ChildProcess } from "node:child_process";
import { appendFileSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { chromium, type Request } from "playwright-core";

const PORT = Number(process.env.BUDGET_PORT ?? 3412);
const BASE = `http://localhost:${PORT}`;
const OUT = resolve(process.cwd(), ".budget");
const DATA = resolve(OUT, "data");
const LOG = resolve(OUT, "server.log");
const JSON_OUT = process.argv.includes("--json");

/** Bytes on the wire, which is what a metered prepaid bundle is billed in. */
const BUDGET = {
  script: 180 * 1024,
  stylesheet: 40 * 1024,
};

/**
 * The three cold opens that matter. The supplier's invite is the one that
 * decides whether a stranger with 200 naira of data trusts this enough to
 * continue, so it is the screen the budget is really about.
 */
const SCREENS = [
  ["supplier invite", "/s/i/AGB-4471"],
  ["supplier new invoice", "/s/new"],
  ["buyer sign in", "/c/signin"],
] as const;

type Tally = {
  script: number;
  stylesheet: number;
  font: number;
  image: number;
  document: number;
  other: number;
};

function empty(): Tally {
  return { script: 0, stylesheet: 0, font: 0, image: 0, document: 0, other: 0 };
}

function kb(bytes: number): string {
  return `${(bytes / 1024).toFixed(1)}KB`;
}

function bucket(request: Request): keyof Tally {
  const type = request.resourceType();
  if (type === "script" || type === "stylesheet" || type === "font" || type === "image") {
    return type;
  }
  return type === "document" ? "document" : "other";
}

function run(command: string, args: string[], env: Record<string, string>): void {
  execFileSync(command, args, {
    env: { ...process.env, ...env },
    stdio: JSON_OUT ? "ignore" : "inherit",
  });
}

async function startServer(env: Record<string, string>): Promise<ChildProcess> {
  try {
    execFileSync("sh", ["-c", `lsof -ti tcp:${PORT} | xargs -r kill -9`], { stdio: "ignore" });
    await new Promise((done) => setTimeout(done, 500));
  } catch {
    // Nothing was listening.
  }

  const server = spawn("npx", ["next", "start", "-p", String(PORT)], {
    env: { ...process.env, ...env },
    detached: true,
  });
  const record = (chunk: Buffer) => appendFileSync(LOG, chunk.toString());
  server.stdout?.on("data", record);
  server.stderr?.on("data", record);

  for (let attempt = 0; attempt < 120; attempt += 1) {
    await new Promise((done) => setTimeout(done, 500));
    if (server.exitCode !== null) break;
    const alive = await fetch(`${BASE}/s/help`)
      .then((response) => response.ok)
      .catch(() => false);
    if (alive) return server;
  }

  if (server.pid) process.kill(-server.pid, "SIGTERM");
  throw new Error(`the app never came up on ${BASE}. See ${LOG}`);
}

async function main(): Promise<void> {
  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });
  writeFileSync(LOG, "");

  // NODE_ENV is deliberately not set here: `next build` and `next start` set
  // it themselves, and forcing it makes the seed refuse to run — correctly,
  // since its whole job is to never touch a production database.
  const env = {
    NEXT_DIST_DIR: ".next-budget",
    DATABASE_URL: `pglite://${DATA}`,
    STAMPA_FAKE_LATENCY_MS: "0",
    STAMPA_OPERATORS: "ops@stampa.ng",
    APP_URL: BASE,
    OTP_PEPPER: "budget-pepper-of-at-least-thirty-two-chars",
  };

  if (!JSON_OUT) console.log("building for production");
  run("npx", ["next", "build"], env);
  if (!JSON_OUT) console.log("seeding");
  run("npx", ["tsx", "scripts/seed.mts"], env);

  const server = await startServer(env);
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH ?? "/usr/local/bin/google-chrome",
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });

  const report: Record<
    string,
    Tally & { total: number; paintedMs: number; interactiveMs: number }
  > = {};
  const problems: string[] = [];

  try {
    for (const [name, path] of SCREENS) {
      // A fresh context every time: the budget is about the first visit, and a
      // warm HTTP cache is exactly the thing that hides a heavy first visit.
      const context = await browser.newContext({ viewport: { width: 360, height: 740 } });
      const page = await context.newPage();
      const tally = empty();

      page.on("response", async (response) => {
        const size = await response
          .request()
          .sizes()
          .then((sizes) => sizes.responseBodySize)
          .catch(() => 0);
        tally[bucket(response.request())] += size;
      });

      await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });

      // Anything painted above the fold before the user scrolls.
      const aboveFold = await page.evaluate(() =>
        [...document.querySelectorAll("img")].filter(
          (image) => image.getBoundingClientRect().top < window.innerHeight,
        ).length,
      );
      if (aboveFold > 0) {
        problems.push(`${name}: ${aboveFold} image(s) above the fold`);
      }

      const total = Object.values(tally).reduce((sum, value) => sum + value, 0);
      report[name] = { ...tally, total, paintedMs: 0, interactiveMs: 0 };

      // Bytes are a proxy. Seconds on a weak cell are the thing itself, so
      // measure the same screen again over an emulated 3G link: 200kbps down
      // with 400ms of latency.
      const slowContext = await browser.newContext({ viewport: { width: 360, height: 740 } });
      const slowPage = await slowContext.newPage();
      const cdp = await slowContext.newCDPSession(slowPage);
      await cdp.send("Network.emulateNetworkConditions", {
        offline: false,
        latency: 400,
        downloadThroughput: (200 * 1024) / 8,
        uploadThroughput: (100 * 1024) / 8,
      });
      await slowPage.goto(`${BASE}${path}`, { waitUntil: "load", timeout: 120_000 });
      const timing = await slowPage.evaluate(() => {
        const paint = performance.getEntriesByName("first-contentful-paint")[0];
        const navigation = performance.getEntriesByType(
          "navigation",
        )[0] as PerformanceNavigationTiming;
        return {
          painted: Math.round(paint?.startTime ?? 0),
          interactive: Math.round(navigation?.domInteractive ?? 0),
        };
      });
      report[name].paintedMs = timing.painted;
      report[name].interactiveMs = timing.interactive;
      await slowContext.close();

      if (tally.script > BUDGET.script) {
        problems.push(
          `${name}: script ${kb(tally.script)} over the ${kb(BUDGET.script)} budget`,
        );
      }
      if (tally.stylesheet > BUDGET.stylesheet) {
        problems.push(
          `${name}: stylesheet ${kb(tally.stylesheet)} over the ${kb(BUDGET.stylesheet)} budget`,
        );
      }

      await context.close();
    }
  } finally {
    await browser.close();
    if (server.pid) {
      try {
        process.kill(-server.pid, "SIGTERM");
      } catch {
        server.kill("SIGTERM");
      }
    }
  }

  if (JSON_OUT) {
    console.log(JSON.stringify({ budget: BUDGET, screens: report, problems }, null, 2));
  } else {
    console.log("\nFirst load, cold cache, bytes on the wire\n");
    console.log(
      ["screen", "js", "css", "font", "img", "html", "total", "paint*", "ready*"]
        .map((heading) => heading.padEnd(heading === "screen" ? 22 : 9))
        .join(""),
    );
    for (const [name, tally] of Object.entries(report)) {
      console.log(
        [
          name.padEnd(22),
          kb(tally.script).padEnd(9),
          kb(tally.stylesheet).padEnd(9),
          kb(tally.font).padEnd(9),
          kb(tally.image).padEnd(9),
          kb(tally.document).padEnd(9),
          kb(tally.total).padEnd(9),
          `${(tally.paintedMs / 1000).toFixed(1)}s`.padEnd(9),
          `${(tally.interactiveMs / 1000).toFixed(1)}s`,
        ].join(""),
      );
    }
    console.log("\n* over an emulated weak 3G cell: 200kbps down, 400ms latency");
    console.log(`\nbudget: ${kb(BUDGET.script)} js, ${kb(BUDGET.stylesheet)} css`);
    if (problems.length) {
      console.log(`\n${problems.length} over budget:`);
      for (const problem of problems) console.log(`  ${problem}`);
    } else {
      console.log("\nwithin budget");
    }
  }

  process.exit(problems.length ? 1 : 0);
}

await main();
