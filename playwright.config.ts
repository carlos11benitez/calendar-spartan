import { defineConfig } from '@playwright/test';
// Run `npx playwright install chromium` once before first test run.
// Browser binary is ~150MB, downloaded to ~/.cache/ms-playwright (or platform equivalent).
export default defineConfig({
  testDir: './e2e/specs',
  // Screenshot generation is opt-in via `npm run screenshots`; exclude from default e2e run.
  testIgnore: process.env.SCREENSHOTS ? [] : [/screenshots\.spec\.ts$/],
  timeout: 30_000,
  fullyParallel: false, // dev server is single-instance
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4200',
    headless: true,
    viewport: { width: 1280, height: 720 },
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
  webServer: {
    command: 'npm start',
    url: 'http://localhost:4200',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
