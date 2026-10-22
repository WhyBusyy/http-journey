import { test, expect } from '@playwright/test';

test('scrolling through a step advances message and packet', async ({ page }) => {
  await page.goto('/');
  const d = page.locator('#step-3 [data-active-message]');
  await page.locator('#step-3').scrollIntoViewIfNeeded();
  await expect(d).toBeVisible();
  const before = Number(await d.getAttribute('data-packet'));
  await page.mouse.wheel(0, 400);
  await page.waitForTimeout(200);
  // 왕복 메시지가 있으면 점이 돌아오기도 하므로 '움직였다'만 확인한다(방향은 단위 테스트가 검증)
  expect(Number(await d.getAttribute('data-packet'))).not.toBe(before);
  expect(Number(await page.locator('[data-elapsed]').getAttribute('data-elapsed'))).toBeGreaterThan(0);
});

test('reduced motion snaps packet to a node', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.locator('#step-3').scrollIntoViewIfNeeded();
  await page.mouse.wheel(0, 300);
  await page.waitForTimeout(200);
  const p = Number(await page.locator('#step-3 [data-packet]').getAttribute('data-packet'));
  expect(Number.isInteger(p)).toBe(true);
});

test('no horizontal overflow at 360px', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto('/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
