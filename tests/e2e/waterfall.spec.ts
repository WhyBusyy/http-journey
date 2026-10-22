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
