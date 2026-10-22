import { test, expect } from '@playwright/test';
import { steps } from '../../src/data/steps';

test('renders 9 step sections in order', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('section[data-step]')).toHaveCount(9);
  await expect(page.locator('section[data-step]').first()).toHaveAttribute('id', 'step-0');
});

test('hero guide reads as two lines with correct spacing, no emphasis', async ({ page }) => {
  await page.goto('/');
  const p = page.locator('header p', { hasText: '한 단계씩 따라가 봐요.' });
  await expect(p).toHaveText('아래로 스크롤하면서 그 여정을 한 단계씩 따라가 봐요.단계마다 무슨 일이 있는지 논리적, 물리적 상황을 함께 보여드려요.');
  await expect(p.locator('br')).toHaveCount(1);
  await expect(p.locator('span')).toHaveCount(0);
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
