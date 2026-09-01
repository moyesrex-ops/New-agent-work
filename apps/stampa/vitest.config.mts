import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(import.meta.dirname, "./src"),
      // `server-only` is a build-time guard supplied by Next, not a runtime
      // package. Under Vitest it resolves to nothing, which is correct: the
      // tests are the server.
      "server-only": resolve(import.meta.dirname, "./src/tests/support/server-only.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["src/tests/**/*.test.ts", "src/tests/**/*.test.tsx"],
    // PGlite boots a WebAssembly Postgres per suite; the default 5s is tight
    // on a cold cache and produces flakes that are not defects.
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
