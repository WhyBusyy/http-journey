import { test, expect } from '@playwright/test';

test('scrolling through a step advances message and packet', async ({ page }) => {
  await page.goto('/');
  const d = page.locator('#step-3 [data-active-message]');
  await page.locator('#step-3').scrollIntoViewIfNeeded();
  await expect(d).toBeVisible();
  const before = Number(await d.getAttribute('data-packet'));
  await page.mouse.wheel(0, 400);
  await page.waitForTimeout(200);
  // data-packet은 줄을 이어 센 누적 위치라 아래로 스크롤하면 항상 커진다
  expect(Number(await d.getAttribute('data-packet'))).toBeGreaterThan(before);
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

test('steps with a response use a sequence diagram, one arrow per message', async ({ page }) => {
  await page.goto('/');
  for (const [step, arrows] of [[2, 2], [3, 3], [4, 3], [7, 3]] as const) {
    await expect(page.locator(`#step-${step} [data-lane="sequence"] [data-arrow]`)).toHaveCount(arrows);
  }
  await expect(page.locator('#step-3 [data-arrow][data-state="active"]')).toHaveCount(1);
});

test('one-way steps keep the row layout', async ({ page }) => {
  await page.goto('/');
  for (const step of [0, 1, 5, 6, 8]) {
    await expect(page.locator(`#step-${step} [data-lane="rows"]`)).toHaveCount(1);
    await expect(page.locator(`#step-${step} [data-lane="sequence"]`)).toHaveCount(0);
  }
});

test('node labels stay visible on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto('/');
  await page.locator('#step-3').scrollIntoViewIfNeeded();
  await expect(page.locator('#step-3 [data-diagram]').getByText('기지국').first()).toBeVisible();
});
