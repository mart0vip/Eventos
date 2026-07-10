import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

const plugins = [react()];
const resolve = {
  tsconfigPaths: true,
  alias: {
    "next/font/google": path.resolve(__dirname, "tests/mocks/next-font-google.ts"),
  },
};

// Single root config using Vitest "projects" so `vitest run --coverage` produces
// one merged coverage report/threshold across both the jsdom component suite and
// the real-Postgres integration suite, while `--project unit`/`--project integration`
// still let each run independently (the fast path needs no DB at all).
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    test: {
      coverage: {
        provider: "v8",
        reporter: ["text", "text-summary", "html", "lcov"],
        thresholds: { lines: 80, statements: 80, functions: 80, branches: 80 },
        include: ["src/**/*.{ts,tsx}"],
        exclude: [
          "**/*.d.ts",
          "src/types/**",
          "src/lib/db/migrate.ts",
          "src/lib/db/seed-dev.ts",
          "src/lib/db/migrations/**",
          "scripts/**",
          "vitest.config.ts",
          "tests/**",
        ],
      },
      projects: [
        {
          plugins,
          resolve,
          test: {
            name: "unit",
            environment: "jsdom",
            setupFiles: ["./tests/setup/vitest.setup.ts"],
            globals: true,
            env,
            exclude: ["**/node_modules/**", "**/.next/**", "**/*.integration.test.ts"],
          },
        },
        {
          plugins,
          resolve,
          test: {
            name: "integration",
            environment: "node",
            globals: true,
            env,
            include: ["**/*.integration.test.ts"],
            exclude: ["**/node_modules/**", "**/.next/**"],
          },
        },
      ],
    },
  };
});
