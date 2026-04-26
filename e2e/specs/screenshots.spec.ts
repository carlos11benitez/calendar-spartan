/**
 * Generates README screenshots in light + dark mode at desktop and mobile
 * breakpoints. Run with:
 *
 *   npx playwright test e2e/screenshots.spec.ts
 *
 * Outputs to `docs/screenshots/`. The folder is committed to the repo
 * (it is small PNGs, not generated test artefacts) so the README can
 * embed them directly without a build step.
 *
 * Note: this spec is excluded from the default e2e run via a regex in
 * `playwright.config.ts` (testMatch). It only runs when invoked by name.
 */
import { test, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const OUT_DIR = join(process.cwd(), 'docs', 'screenshots');
mkdirSync(OUT_DIR, { recursive: true });

const DESKTOP = { width: 1280, height: 720 };
const MOBILE = { width: 375, height: 812 };

async function setTheme(page: Page, mode: 'light' | 'dark') {
  await page.evaluate((target) => {
    const root = document.documentElement;
    if (target === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
  }, mode);
}

async function clickModeButton(page: Page, label: 'Day view' | 'Week view' | 'Month view') {
  await page.getByRole('button', { name: label }).click();
  await page.waitForTimeout(400); // let any view-transition animations settle
}

async function shoot(page: Page, name: string) {
  await page.screenshot({ path: join(OUT_DIR, `${name}.png`), fullPage: false });
}

test.describe('README screenshots', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForTimeout(500);
  });

  test('desktop light: month, week, day, dialog', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await setTheme(page, 'light');

    await clickModeButton(page, 'Month view');
    await shoot(page, 'desktop-light-month');

    await clickModeButton(page, 'Week view');
    await shoot(page, 'desktop-light-week');

    await clickModeButton(page, 'Day view');
    await shoot(page, 'desktop-light-day');

    await page.getByRole('button', { name: 'Add Event' }).click();
    await page.locator('[role="dialog"]').waitFor({ state: 'visible' });
    await page.waitForTimeout(300);
    await shoot(page, 'desktop-light-dialog');
  });

  test('desktop dark: month, week, day', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await setTheme(page, 'dark');

    await clickModeButton(page, 'Month view');
    await shoot(page, 'desktop-dark-month');

    await clickModeButton(page, 'Week view');
    await shoot(page, 'desktop-dark-week');

    await clickModeButton(page, 'Day view');
    await shoot(page, 'desktop-dark-day');
  });

  test('mobile light: month, week, dialog', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await setTheme(page, 'light');

    await clickModeButton(page, 'Month view');
    await shoot(page, 'mobile-light-month');

    await clickModeButton(page, 'Week view');
    await shoot(page, 'mobile-light-week');

    await page.getByRole('button', { name: 'Add Event' }).click();
    await page.locator('[role="dialog"]').waitFor({ state: 'visible' });
    await page.waitForTimeout(300);
    await shoot(page, 'mobile-light-dialog');
  });

  test('mobile dark: month, week', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await setTheme(page, 'dark');

    await clickModeButton(page, 'Month view');
    await shoot(page, 'mobile-dark-month');

    await clickModeButton(page, 'Week view');
    await shoot(page, 'mobile-dark-week');
  });
});
