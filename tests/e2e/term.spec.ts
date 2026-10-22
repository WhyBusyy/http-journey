import { test, expect } from '@playwright/test';

test('term tooltip shows on focus (touch-friendly), hidden otherwise', async ({ page }) => {
  await page.goto('/');
  const term = page.locator('.term').first();
  const tip = term.locator('[role=tooltip]');
  await expect(tip).toBeHidden();
  await term.focus();
  await expect(tip).toBeVisible();
});
