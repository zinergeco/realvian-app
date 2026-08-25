import { defineConfig, devices } from "@playwright/test";

/**
 * E2E tests against a real, built Next.js server — not mocked HTML,
 * not jsdom. Deliberately scoped to pages and flows that work with no
 * DATABASE_URL configured, matching exactly how this app's own CI
 * build already runs (see .github/workflows/ci.yml) — every
 * data-access function is written to fail closed to an empty result
 * rather than throw, specifically so public pages keep working if the
 * database is briefly unreachable. These tests hold that property to
 * account, the same way the unit tests hold the calculators to
 * account.
 *
 * Signed-in flows (saving a comparison, generating an API key, the
 * account page) are NOT covered here — they need a real database
 * connection this environment doesn't have. Those are verified
 * manually against the live site instead, as documented in each
 * feature's original session summary.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3100",
    trace: "retain-on-failure",
    launchOptions: process.env.PLAYWRIGHT_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH }
      : undefined,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "bash e2e/start-server.sh",
    url: "http://localhost:3100",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
