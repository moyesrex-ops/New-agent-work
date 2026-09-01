/**
 * Boot check (release test RT-07).
 *
 * Next runs this once per server process before it takes traffic, which makes
 * it the only place a configuration mistake can be turned into a failed deploy
 * rather than a failed invoice. The alternative — discovering a missing
 * OTP_PEPPER when a supplier requests their first code — puts the cost of our
 * mistake on the one person who has least reason to forgive it.
 */
export async function register(): Promise<void> {
  const { checkEnv, formatProblems } = await import("./lib/env");
  const { problems } = checkEnv();
  if (problems.length) throw new Error(formatProblems(problems));
}
