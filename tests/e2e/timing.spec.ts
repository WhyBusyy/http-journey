import { test, expect } from '@playwright/test';

const fontPx = (el: Element) => parseFloat(getComputedStyle(el).fontSize);

test('step time is large and sits right of the title on desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/');
  const ms = page.locator('#step-3 [data-step-ms]');
  const title = page.locator('#step-3 h2');
  await expect(ms).toHaveText('+18ms');
  expect(await ms.evaluate(fontPx)).toBeGreaterThanOrEqual(30);
  const m = (await ms.boundingBox())!;
  const t = (await title.boundingBox())!;
  expect(m.x).toBeGreaterThan(t.x + t.width);
  expect(m.y).toBeLessThan(t.y + t.height); // 제목과 같은 높이대
});

test('step time moves above the title on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto('/');
  const m = (await page.locator('#step-3 [data-step-ms]').boundingBox())!;
  const t = (await page.locator('#step-3 h2').boundingBox())!;
  expect(m.y + m.height).toBeLessThanOrEqual(t.y + 1);
});

test('progress bar elapsed number is enlarged', async ({ page }) => {
  await page.goto('/');
  const n = page.locator('[data-elapsed] [data-elapsed-value]');
  expect(await n.evaluate(fontPx)).toBeGreaterThanOrEqual(18);
});
