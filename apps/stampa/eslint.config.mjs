import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // The browser walk builds into its own distDir so it can run beside a dev
    // server. Compiled output is not source and must not reach the linter.
    ".next-walk/**",
    ".walk/**",
    ".data/**",
  ]),
]);

export default eslintConfig;
