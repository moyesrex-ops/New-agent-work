import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": resolve(import.meta.dirname, "./src") },
  },
  test: {
    environment: "node",
    include: ["src/tests/**/*.test.ts"],
    // PGlite boots a WebAssembly Postgres per suite; the default 5s is tight
    // on a cold cache and produces flakes that are not defects.
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
