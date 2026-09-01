/**
 * Boot check (release test RT-07).
 *
 * Paths that need configuration still fail closed through `env()`. The public
 * site does not: a Vercel host with `STAMPA_GATEWAY=hold` and no Postgres yet
 * must still serve the FAQ rather than a 500. Problems are named on
 * `/api/health` and in this log.
 */
export async function register(): Promise<void> {
  const { checkEnv, formatProblems } = await import("./lib/env");
  const { problems } = checkEnv();
  if (problems.length) console.error(formatProblems(problems));
}
