import { test, expect } from '@playwright/test';
import { steps } from '../../src/data/steps';

test('renders 9 step sections in order', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('section[data-step]')).toHaveCount(9);
  await expect(page.locator('section[data-step]').first()).toHaveAttribute('id', 'step-0');
});

test('extra detail toggle is labeled 더 알아보기', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#step-3 summary')).toContainText('더 알아보기');
});

test.describe('without JS', () => {
  test.use({ javaScriptEnabled: false });

  test('content readable from static HTML', async ({ page }) => {
    await page.goto('/');
    for (const s of steps) await expect(page.locator(`#step-${s.index}`)).toContainText(s.title);
    await expect(page.locator('footer')).toContainText('The Nodebook');
    await expect(page.locator('footer a[href="https://200ms.thenodebook.com"]')).toHaveCount(1);
  });
});
