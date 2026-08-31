import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Overridable so `npm run walk` can boot its own instance beside a dev
   * server you already have running. Next refuses two dev servers sharing a
   * build directory, and "stop what you are doing first" is the kind of
   * friction that stops a check being run.
   */
  distDir: process.env.NEXT_DIST_DIR ?? ".next",

  /**
   * PGlite ships a WASM build and resolves its own assets from disk. Bundled,
   * those lookups are handed a URL where the Node filesystem wants a path, and
   * every query fails at runtime. It is a development and test dependency
   * only — production talks to a managed Postgres over node-postgres — so
   * leaving it external costs nothing.
   */
  serverExternalPackages: ["@electric-sql/pglite"],

  /**
   * Off because the generated files describe the framework, not this codebase,
   * and an unread file at the repository root that claims to be instructions
   * is worse than no file.
   */
  agentRules: false,
};

export default nextConfig;
