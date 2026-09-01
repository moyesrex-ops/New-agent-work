/**
 * Stand-in for Next's `server-only` guard, aliased in vitest.config.mts.
 *
 * The real package exists to make a client component importing server code a
 * build error. Under Vitest there is no client, so the guard has nothing to
 * guard and this file is deliberately empty.
 */
export {};
