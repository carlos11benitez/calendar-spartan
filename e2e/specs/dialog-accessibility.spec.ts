import { test, expect } from '@playwright/test';

test.describe('Dialog accessibility (F14 gaps closed by F15b)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    // Open the New Event dialog. Button text is "Add Event" (with icon + text node).
    await page.getByRole('button', { name: 'Add Event' }).click();
    // Wait for dialog to be visible.
    await page.locator('[role="dialog"]').waitFor({ state: 'visible' });
  });

  test('T-01: submit button aria-disabled toggles with form validity (REQ-F14-06)', async ({ page }) => {
    const dialog = page.locator('[role="dialog"]');
    // Submit button text is "Create event" per calendar-new-event-dialog.component.ts line 74.
    const submit = dialog.getByRole('button', { name: 'Create event' });

    // Initial: form invalid (title empty), [attr.aria-disabled]="form.invalid || null" → "true"
    await expect(submit).toHaveAttribute('aria-disabled', 'true');

    // Fill title — form becomes valid (title is the only required field)
    await dialog.locator('#new-title').fill('E2E test event');

    // After: aria-disabled should be null (not present) because form.invalid || null → null
    const ariaDisabled = await submit.getAttribute('aria-disabled');
    expect(ariaDisabled).not.toBe('true');
  });

  test('T-02: datepicker hosts have aria-labels (REQ-F14-07)', async ({ page }) => {
    const dialog = page.locator('[role="dialog"]');
    // Datepickers use hlm-date-time-picker with [attr.aria-label] set per template.
    const pickers = dialog.locator('hlm-date-time-picker');

    // 2 pickers: start + end
    await expect(pickers).toHaveCount(2);

    // First is "Start time", second is "End time" per calendar-new-event-dialog.component.ts
    await expect(pickers.nth(0)).toHaveAttribute('aria-label', 'Start time');
    await expect(pickers.nth(1)).toHaveAttribute('aria-label', 'End time');
  });
});
