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
  // og:image는 배포 도메인 절대 URL이라 경로만 떼서 로컬 서버로 확인한다
  const res = await page.request.get(new URL(img!).pathname);
  expect(res.status()).toBe(200);
  expect(res.headers()['content-type']).toContain('image/png');
});

test('search engines get canonical, structured data, robots and sitemap', async ({ page }) => {
  const site = 'https://http-journey.whybusyy.com/';
  await page.goto('/');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', site);
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', site);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', `${site}og.png`);
  const ld = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent())!);
  expect(ld.url).toBe(site);
  expect(ld.inLanguage).toBe('ko');

  const robots = await (await page.request.get('/robots.txt')).text();
  expect(robots).toContain(`Sitemap: ${site}sitemap.xml`);
  const sitemap = await (await page.request.get('/sitemap.xml')).text();
  expect(sitemap).toContain(`<loc>${site}</loc>`);
});
