import { test, expect, type Locator } from '@playwright/test';

const box = async (l: Locator) => (await l.boundingBox())!;

test('term tooltip shows on focus (touch-friendly), hidden otherwise', async ({ page }) => {
  await page.goto('/');
  const term = page.locator('.term').first();
  const tip = term.locator('[role=tooltip]');
  await expect(tip).toBeHidden();
  await term.focus();
  await expect(tip).toBeVisible();
});

test('abbreviation tooltip shows full name and Korean description', async ({ page }) => {
  await page.goto('/');
  const term = page.locator('header .term', { hasText: /^TCP/ });
  await term.focus();
  const tip = term.locator('[role=tooltip]');
  await expect(tip).toContainText('Transmission Control Protocol');
  await expect(tip).toContainText('빠짐없이');
});

test('tooltip opens right below its own chip', async ({ page }) => {
  await page.goto('/');
  const term = page.locator('header .term', { hasText: /^TLS/ });
  await term.hover();
  const tip = term.locator('[role=tooltip]');
  await expect(tip).toBeVisible();
  const c = await box(term);
  const t = await box(tip);
  expect(t.y).toBeGreaterThanOrEqual(c.y + c.height - 1);
  expect(t.y - (c.y + c.height)).toBeLessThan(16);
  // 데스크톱 폭에서 Hero 칩은 화면 끝에 닿지 않으므로 툴팁 왼쪽이 칩 왼쪽에 맞춰져야 한다
  expect(Math.abs(t.x - c.x)).toBeLessThan(2);
});

test('tooltips stay inside the viewport at 360px', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto('/');
  const terms = page.locator('#step-3 .term').filter({ visible: true });
  const n = await terms.count();
  expect(n).toBeGreaterThan(5);
  for (let i = 0; i < n; i++) {
    const term = terms.nth(i);
    await term.scrollIntoViewIfNeeded();
    await term.focus();
    const t = await box(term.locator('[role=tooltip]'));
    expect(t.x, `term ${i}`).toBeGreaterThanOrEqual(0);
    expect(t.x + t.width, `term ${i}`).toBeLessThanOrEqual(360);
  }
});
