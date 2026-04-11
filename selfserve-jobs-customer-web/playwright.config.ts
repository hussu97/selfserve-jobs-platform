import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for jobs4u E2E tests.
 *
 * By default tests run against http://localhost:3000.
 * Override via the BASE_URL env var to point at a staging environment.
 *
 * Run:   npm run e2e
 * UI:    npm run e2e:ui
 * CI:    BASE_URL=https://staging.example.com npm run e2e
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'html',

  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'Desktop Chrome',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Tablet',
      use: {
        ...devices['iPad Mini'],
        viewport: { width: 768, height: 1024 },
      },
    },
  ],

  // Start the dev server automatically when running locally (not in CI).
  // In CI, set BASE_URL to a pre-deployed environment instead.
  webServer: process.env.CI
    ? undefined
    : {
        command: 'npm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
