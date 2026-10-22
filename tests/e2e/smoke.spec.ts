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

test('link previews have OG meta', async ({ page }) => {
  await page.goto('/');
  for (const prop of ['og:title', 'og:description', 'og:image', 'og:type']) {
    await expect(page.locator(`meta[property="${prop}"]`)).toHaveAttribute('content', /.+/);
  }
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');
  const img = await page.locator('meta[property="og:image"]').getAttribute('content');
  const res = await page.request.get(img!);
  expect(res.status()).toBe(200);
  expect(res.headers()['content-type']).toContain('image/png');
});
