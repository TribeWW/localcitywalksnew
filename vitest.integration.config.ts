import { configDefaults, defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

/**
 * Vitest config for opt-in live integration tests (LOC-1164).
 *
 * Separate from the default config so `*.integration.test.ts` files are
 * included when running `npm run test:integration:checkout`.
 */
export default defineConfig({
  plugins: [tsconfigPaths()],
  esbuild: {
    jsx: "automatic",
  },
  test: {
    environment: "node",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
    clearMocks: true,
    envFile: ".env.local",
    include: ["**/*.integration.test.ts"],
    exclude: [...configDefaults.exclude],
  },
});
