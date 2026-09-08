import { defineConfig, devices } from "@playwright/test";

/**
 * E2E configuration.
 *
 * The suite is split because two kinds of proof need two different servers,
 * and running them against the wrong one produces failures that look like app
 * bugs but are really setup mistakes:
 *
 *   DEFAULT ("chromium")  -> a PRODUCTION server (`npm run start`).
 *     Auth is genuinely enforced there (OPEN_DASHBOARDS is hard-disabled in
 *     production builds), so redirects, 403s and real Clerk sign-in are
 *     meaningful. This is what `npm run test:e2e` runs.
 *
 *   OPT-IN ("authenticated-ui") -> a DEV server started with OPEN_DASHBOARDS=true
 *     on :3100. It reaches the signed-in workspaces without a session purely to
 *     prove they RENDER — it cannot and does not test isolation.
 *     Run with: npm run test:e2e:auth
 *
 * IMPORTANT: don't run a dev server and a production server from the same
 * checkout at once. They share the .next directory, and the dev server
 * overwrites the production build's static chunks — the production app then
 * serves HTML pointing at chunks that no longer exist, and every page silently
 * fails to hydrate. Use `npm run test:e2e:auth` on its own.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  // Serial: these share one database and one Clerk instance, so a parallel
  // writer would turn real assertions into intermittent noise.
  workers: 1,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  timeout: 90_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    actionTimeout: 20_000,
    navigationTimeout: 45_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      // Rendering-only checks need the dev server; excluded from the main run.
      testIgnore: /authenticated-ui\.spec\.ts/,
    },
    {
      name: "authenticated-ui",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3100",
      },
      testMatch: /authenticated-ui\.spec\.ts/,
    },
  ],
});
