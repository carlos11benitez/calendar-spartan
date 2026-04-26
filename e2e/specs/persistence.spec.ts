import { test, expect } from '@playwright/test';

test.describe('Event persistence (F10 smoke)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('T-03: created event survives page reload', async ({ page }) => {
    // Create an event
    await page.getByRole('button', { name: 'Add Event' }).click();
    const dialog = page.locator('[role="dialog"]');
    await dialog.locator('#new-title').fill('E2E PERSISTED EVENT');
    await dialog.getByRole('button', { name: 'Create event' }).click();

    // Wait for dialog to close
    await expect(dialog).toBeHidden();

    // Reload
    await page.reload();

    // Verify event in storage
    const storage = await page.evaluate(() => {
      const raw = localStorage.getItem('calendar-spartan/events/v1');
      const arr = raw ? JSON.parse(raw) : [];
      return arr.some((e: { title: string }) => e.title === 'E2E PERSISTED EVENT');
    });
    expect(storage).toBe(true);
  });
});
