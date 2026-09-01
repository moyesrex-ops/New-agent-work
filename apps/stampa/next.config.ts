import type { NextConfig } from "next";

function securityHeaders(): Array<{ key: string; value: string }> {
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    ...(process.env.NODE_ENV === "production" ? ["upgrade-insecure-requests"] : []),
  ].join("; ");

  const headers = [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    { key: "Content-Security-Policy", value: csp },
  ];

  if (process.env.NODE_ENV === "production") {
    headers.push({
      key: "Strict-Transport-Security",
      value: "max-age=63072000; includeSubDomains; preload",
    });
  }

  return headers;
}

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

  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders(),
      },
      {
        source: "/.well-known/apple-app-site-association",
        headers: [{ key: "Content-Type", value: "application/json" }],
      },
    ];
  },

  /**
   * Off because the generated files describe the framework, not this codebase,
   * and an unread file at the repository root that claims to be instructions
   * is worse than no file.
   */
  agentRules: false,
};

export default nextConfig;
