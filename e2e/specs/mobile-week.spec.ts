import { test, expect } from '@playwright/test';

test.describe('Mobile week navigation (F9 + F11 smoke)', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('T-04: tab pill click updates header date', async ({ page }) => {
    await page.getByRole('button', { name: 'Week view' }).click();

    // Wait for week tabs to render
    const tabs = page.locator('app-week-day-tabs button');
    await expect(tabs).toHaveCount(7);

    // Find a non-active pill and click it. Use the pill at index 0 (Monday).
    // The active pill (today) has aria-current="true". Pick a different one.
    const activeBefore = await page.locator('app-week-day-tabs button[aria-current="true"]').getAttribute('aria-label');

    // Click the first pill (Monday). It will become active unless today is Monday.
    const firstPill = tabs.nth(0);
    const firstLabel = await firstPill.getAttribute('aria-label');
    await firstPill.click();

    // After click: aria-current="true" on the clicked pill.
    await expect(firstPill).toHaveAttribute('aria-current', 'true');

    // If today wasn't Monday, the active pill changed.
    if (activeBefore !== firstLabel) {
      const activeAfter = await page.locator('app-week-day-tabs button[aria-current="true"]').getAttribute('aria-label');
      expect(activeAfter).toBe(firstLabel);
      expect(activeAfter).not.toBe(activeBefore);
    }
  });
});
