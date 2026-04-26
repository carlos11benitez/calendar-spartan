import { test, expect } from '@playwright/test';

test.describe('Month roving tabindex (F13 smoke)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('T-05: exactly one month cell has tabindex=0', async ({ page }) => {
    await page.getByRole('button', { name: 'Month view' }).click();

    // Wait for grid to render
    await page.locator('app-calendar-body-month-cell').first().waitFor();

    const cells = page.locator('app-calendar-body-month-cell');
    const total = await cells.count();
    expect(total).toBeGreaterThanOrEqual(28); // at least 4 weeks

    const tabbable = page.locator('app-calendar-body-month-cell[tabindex="0"]');
    await expect(tabbable).toHaveCount(1);
  });
});
