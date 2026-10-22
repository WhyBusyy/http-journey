// public/og.png(1200×630)를 scripts/og/og.html에서 렌더링한다. 사용: node scripts/og/render.mjs
import { chromium } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.goto(new URL('./og.html', import.meta.url).href);
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: fileURLToPath(new URL('../../public/og.png', import.meta.url)) });
await browser.close();
