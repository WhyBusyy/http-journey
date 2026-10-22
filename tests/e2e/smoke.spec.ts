import { test, expect } from '@playwright/test';

test('page renders in Korean with Pretendard', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ko');
  const font = await page.locator('body').evaluate((e) => getComputedStyle(e).fontFamily);
  expect(font).toContain('Pretendard');
});

test('dark mode follows system', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  const bg = await page.locator('body').evaluate((e) => getComputedStyle(e).backgroundColor);
  expect(bg).toBe('rgb(10, 10, 10)');
});
