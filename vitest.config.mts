import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL(".", import.meta.url)) } },
  oxc: { jsx: { runtime: "automatic" } },
  test: {
    include:
      process.env.INTEGRATION_TESTS === "true"
        ? ["tests/integration/**/*.test.ts"]
        : ["tests/unit/**/*.test.{ts,tsx}"],
    fileParallelism: false,
    testTimeout: 15000,
  },
});
