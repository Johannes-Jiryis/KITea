import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  workers: 1,
  timeout: 180000,
  expect: { timeout: 45000 },
  use: { baseURL: "http://localhost:3101", trace: "retain-on-failure" },
  webServer: {
    command: "node node_modules/next/dist/bin/next dev --hostname localhost --port 3101",
    url: "http://localhost:3101/api/health/live",
    reuseExistingServer: false,
    timeout: 120000,
    env: { NODE_ENV: "development", NEXTAUTH_URL: "http://localhost:3101", KITEA_E2E: "true" },
  },
});
