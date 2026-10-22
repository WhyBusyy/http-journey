import { test, expect } from '@playwright/test';
import { steps } from '../../src/data/steps';
import { computeTimeline } from '../../src/lib/timeline';

test('clicking a bar scrolls to its step', async ({ page }) => {
  await page.goto('/');
  await page.locator('#overview').scrollIntoViewIfNeeded();
  await page.locator('[data-bar="3"]').click();
  await expect(page.locator('#step-3')).toBeInViewport();
});

test('after jumping up, elapsed reflects step 3 range', async ({ page }) => {
  await page.goto('/');
  await page.locator('#overview').scrollIntoViewIfNeeded();
  await page.locator('[data-bar="3"]').click();
  await page.waitForTimeout(800);
  const v = Number(await page.locator('[data-elapsed]').getAttribute('data-elapsed'));
  const { entries } = computeTimeline(steps);
  expect(v).toBeGreaterThanOrEqual(entries[3].start);
  expect(v).toBeLessThanOrEqual(entries[3].start + entries[3].duration);
});

test('reduced motion uses instant scroll', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.locator('#overview').scrollIntoViewIfNeeded();
  await page.locator('[data-bar="0"]').click();
  await expect(page.locator('#step-0')).toBeInViewport({ timeout: 100 });
});

test.describe('before hydration / without JS', () => {
  test.use({ javaScriptEnabled: false });

  test('waterfall bars still jump to their step', async ({ page }) => {
    await page.goto('/');
    await page.locator('#overview').scrollIntoViewIfNeeded();
    await page.locator('[data-bar="3"]').click();
    await expect(page.locator('#step-3')).toBeInViewport();
  });
});

test('jumping straight to the top resets elapsed to 0', async ({ page }) => {
  await page.goto('/');
  await page.locator('#step-4').scrollIntoViewIfNeeded();
  await page.mouse.wheel(0, 200);
  await page.waitForTimeout(200);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForTimeout(200);
  await expect(page.locator('[data-elapsed]')).toHaveAttribute('data-elapsed', '0');
});

test('jumping straight to the overview shows the full total', async ({ page }) => {
  await page.goto('/');
  await page.locator('#step-2').scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
  await page.evaluate(() => document.getElementById('overview')!.scrollIntoView({ behavior: 'instant', block: 'center' }));
  await page.waitForTimeout(200);
  const { total } = computeTimeline(steps);
  await expect(page.locator('[data-elapsed]')).toHaveAttribute('data-elapsed', String(total));
});

test('waterfall bars have a correct accessible name', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-bar="0"]')).toHaveAccessibleName(`Step 0: ${steps[0].title}, ${steps[0].ms}ms. 이 단계로 이동`);
});
