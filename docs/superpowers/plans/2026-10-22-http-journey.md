# http-journey Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 주니어 개발자가 HTTP 요청 하나의 물리·논리 경로를 스크롤로 따라가며 이해하는 한국어 단일 페이지를 Astro로 만들어 Vercel에 배포한다.

**Architecture:** Astro가 본문 전체를 정적 HTML로 생성하고, 움직이는 부분(두 레인 다이어그램, 상단 진행 바, 워터폴)만 React island로 hydrate한다. 모든 Step 데이터(ms, 메시지, 장비 노드, 본문, 출처)는 `src/data/steps.ts` 한 곳에 있고, island 사이 공유 상태(경과 ms)는 nanostores atom 하나로 연결한다. 용어 툴팁은 JS 없이 CSS(`:hover`/`:focus-within`)로 동작한다.

**Tech Stack:** Astro 7, @astrojs/react, Tailwind CSS 4 (`@tailwindcss/vite`), motion (React), nanostores + @nanostores/react, lucide-react, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-22-http-journey-design.md` (시안: `docs/superpowers/specs/mockups/layers.html` B안 + 하단 워터폴)

## Global Constraints

- 설명은 한국어(해요체, 시안 톤), technical term은 영어 그대로. 용어는 `[[key]]` 마커로 쓰고 glossary에 한국어 한 줄 설명이 있어야 한다.
- 독창성: The Nodebook 200ms 페이지의 문장·섹션 구성·소제목·예시·비유·디자인·연출·코드를 가져오지 않는다. 사실 확인은 RFC, MDN, Node.js, AWS, PostgreSQL 공식 문서로 한다. Footer에 "The Nodebook의 200ms 시각화에서 아이디어를 얻었습니다" + https://200ms.thenodebook.com 링크.
- 시나리오: 서울, 폰(5G/LTE), 웹 쇼핑 앱 "주문하기" → `POST /api/orders` → AWS ap-northeast-2 ALB(TLS 종료) → Node.js(EC2/ECS) → RDS Postgres. HTTP/2 over TCP, TLS 1.3, CloudFront 없음, DB는 connection pool로 이미 연결됨.
- 디자인 토큰: Pretendard Variable, 본문 `slate-800`/보조 `slate-500`, 포인트 `blue-600`(다크 `blue-400`), 다크 배경 `#0a0a0a`, 다크 카드 `#141414`, 카드 `bg-slate-50/80 rounded-2xl` 그림자 없음, `word-break: keep-all`. 다크 모드는 시스템 설정(`prefers-color-scheme`)을 따른다.
- `prefers-reduced-motion: reduce`일 때: 패킷 점은 가장 가까운 노드에 스냅(연속 이동 없음), 전환 애니메이션 없음, 워터폴 클릭 스크롤은 `behavior: 'auto'`.
- 다이어그램은 sticky가 아니다. 각 Step 섹션 안에서 흐르고, 화면에 고정되는 것은 상단 진행 바뿐이다.
- 모든 ms·출처는 `src/data/steps.ts`에만 있다. 근거 전 값은 `provisional: true`. 제목·진행 바 총합은 데이터에서 계산한다.
- 버전 하한: astro ^7.4, @astrojs/react ^7.1, motion ^14.5, nanostores ^1.5. 정적 출력(`output: 'static'`), Vercel 어댑터 없음(정적 배포에 불필요).
- 커밋 메시지에 Co-Authored-By 줄을 넣지 않는다.

## Review Focus

1. **좁은 모바일 화면(360px)**: 물리 레인 노드 4~5개가 가로 스크롤을 만들지 않아야 한다 → Task 5에 `no horizontal overflow at 360px` e2e.
2. **reduced-motion 사용자**: 점이 미끄러지지 않고 노드에 스냅, 워터폴 클릭은 즉시 이동 → Task 5·6에 `emulateMedia({ reducedMotion: 'reduce' })` e2e.
3. **hover가 없는 터치 기기**: 용어 칩을 탭(focus)하면 설명이 보여야 한다 → Task 3에 focus 시 tooltip visible e2e.
4. **JS 로드 전·실패 시**: 본문과 다이어그램 초기 상태(첫 메시지 활성, 점은 첫 노드)가 HTML만으로 읽혀야 한다 → Task 4에 `javaScriptEnabled: false` e2e.
5. **워터폴로 위·아래로 점프 / 빠른 스크롤**: 진행 바의 경과 ms가 현재 보이는 Step 기준으로 맞아야 하고 0~총합 밖으로 나가면 안 된다 → Task 2에 `elapsedAt` clamp 단위 테스트, Task 6에 점프 후 진행 바 값 e2e.

---

## File Structure

```
astro.config.mjs            React + Tailwind vite plugin, output static
src/styles/global.css       Tailwind import, 토큰(@theme), base 스타일, tooltip CSS
src/layouts/Base.astro      <html lang="ko">, 폰트, 메타/OG, global.css
src/pages/index.astro       페이지 조립
src/data/types.ts           Step, LogicalMessage, PhysicalNode, Source 타입
src/data/steps.ts           Step 0~8 데이터(ms, 레인, 본문, 출처)
src/data/glossary.ts        용어 key → { label, ko }
src/lib/timeline.ts         타임라인·진행값 순수 함수
src/lib/terms.ts            [[key]] 마커 파서
src/stores/progress.ts      $elapsedMs atom
src/components/Term.astro, Prose.astro, Hero.astro, StepSection.astro, Footer.astro
src/components/TwoLaneDiagram.tsx, ProgressBar.tsx, Waterfall.tsx   (islands)
scripts/measure.sh          curl -w 타이밍 측정
scripts/check-release.ts    provisional 남아 있으면 실패
docs/numbers.md             측정값·공개 자료·조합 근거
tests/unit/*.test.ts        Vitest
tests/e2e/*.spec.ts         Playwright (preview 서버 대상)
```

---

### Task 1: 프로젝트 스캐폴드와 디자인 토큰

**Files:**
- Create: Astro minimal 템플릿 일체, `src/styles/global.css`, `src/layouts/Base.astro`, `src/pages/index.astro`(임시 Hero 텍스트), `playwright.config.ts`, `vitest.config.ts`, `tests/e2e/smoke.spec.ts`, `.gitignore`
- Modify: `package.json` scripts

**Interfaces:**
- Produces: `Base.astro` props `{ title: string; description: string }`; scripts `npm run build|preview|test|test:e2e`; Tailwind 색 토큰 `bg-page`(white / `#0a0a0a`), `bg-card`(slate-50/80 / `#141414`), `text-accent`(blue-600 / blue-400).

- [ ] **Step 1: 스캐폴드** — `~/http-journey`에서 `npm create astro@latest . -- --template minimal --no-git --install`, 이어서 `npx astro add react tailwind --yes`, `npm i motion nanostores @nanostores/react lucide-react pretendard`, `npm i -D vitest @playwright/test`, `npx playwright install chromium`. `astro.config.mjs`에 `output: 'static'`.
- [ ] **Step 2: 실패하는 smoke 테스트 작성** — `tests/e2e/smoke.spec.ts`:

```ts
test('page renders in Korean with Pretendard', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ko');
  const font = await page.locator('body').evaluate(e => getComputedStyle(e).fontFamily);
  expect(font).toContain('Pretendard');
});
test('dark mode follows system', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  const bg = await page.locator('body').evaluate(e => getComputedStyle(e).backgroundColor);
  expect(bg).toBe('rgb(10, 10, 10)');
});
```
`playwright.config.ts`: `webServer: { command: 'npm run build && npm run preview -- --port 4321', port: 4321 }`, `baseURL: 'http://localhost:4321'`.
- [ ] **Step 3: 실행해 실패 확인** — `npx playwright test tests/e2e/smoke.spec.ts` → lang/폰트/배경 assertion FAIL.
- [ ] **Step 4: 구현** — `Base.astro`(lang="ko", `import 'pretendard/dist/web/variable/pretendardvariable.css'`, global.css), `global.css`에 `@import "tailwindcss";`, `@custom-variant dark (@media (prefers-color-scheme: dark));`, Global Constraints의 토큰을 `@theme`로, body에 `font-family` Pretendard 스택(`~/portfolio/tailwind.config.ts`와 동일 순서), `word-break: keep-all`, reduced-motion 블록(`~/portfolio/src/app/globals.css`와 동일).
- [ ] **Step 5: 통과 확인** — `npx playwright test tests/e2e/smoke.spec.ts` → 2 passed.
- [ ] **Step 6: Commit** — `git add -A && git commit -m "chore: scaffold Astro project with design tokens"`

---

### Task 2: 데이터 모델과 타임라인 함수

**Files:**
- Create: `src/data/types.ts`, `src/data/steps.ts`, `src/lib/timeline.ts`, `tests/unit/timeline.test.ts`, `tests/unit/steps.test.ts`

**Interfaces:**
- Produces:

```ts
// types.ts
export type Source = { label: string; url: string };
export type LogicalMessage = { label: string; direction: 'up' | 'down' }; // up = 클라이언트→서버
export type PhysicalNode = { id: string; label: string; icon: string };  // icon = lucide 컴포넌트 이름
export type Step = {
  index: number;            // 0..8
  slug: string;             // 'tap' | 'url-cache' | 'dns' | 'tcp' | 'tls' | 'arrival' | 'node' | 'db' | 'response'
  title: string;            // 쉬운 한국어 제목
  summary: string;
  ms: number;
  provisional: boolean;
  messages: LogicalMessage[];
  nodes: PhysicalNode[];    // 패킷이 지나는 순서대로
  body: string;             // [[key]] 마커 포함, 2~4문장
  deeper: string;
  practice?: string;        // Step 0에는 없음
  sources: Source[];
};
// timeline.ts
export type TimelineEntry = { index: number; start: number; duration: number };
export function computeTimeline(steps: Step[]): { entries: TimelineEntry[]; total: number };
export function elapsedAt(entry: TimelineEntry, progress: number): number;             // progress를 [0,1]로 clamp
export function activeMessageIndex(progress: number, count: number): number;           // 0..count-1
export function packetPosition(progress: number, nodeCount: number, snap: boolean): number; // 0..nodeCount-1 (실수, snap이면 정수)
```

- [ ] **Step 1: 실패하는 테스트** — `timeline.test.ts`:

```ts
const steps = [{ ms: 5 }, { ms: 20 }, { ms: 18 }] as Step[];
test('computeTimeline accumulates starts', () => {
  expect(computeTimeline(steps)).toEqual({ total: 43, entries: [
    { index: 0, start: 0, duration: 5 }, { index: 1, start: 5, duration: 20 }, { index: 2, start: 25, duration: 18 } ] });
});
test('elapsedAt clamps progress', () => {
  const e = { index: 1, start: 5, duration: 20 };
  expect(elapsedAt(e, -0.5)).toBe(5); expect(elapsedAt(e, 0.5)).toBe(15); expect(elapsedAt(e, 2)).toBe(25);
});
test('activeMessageIndex splits evenly', () => {
  expect(activeMessageIndex(0, 3)).toBe(0); expect(activeMessageIndex(0.34, 3)).toBe(1); expect(activeMessageIndex(1, 3)).toBe(2);
});
test('packetPosition continuous vs snap', () => {
  expect(packetPosition(0.5, 4, false)).toBeCloseTo(1.5); expect(packetPosition(0.5, 4, true)).toBe(2);
  expect(packetPosition(-1, 4, false)).toBe(0); expect(packetPosition(9, 4, true)).toBe(3);
});
```
`steps.test.ts`: `steps.length === 9`, index가 0..8 순서, slug 고유, 모든 step `nodes.length >= 2 && messages.length >= 1`, index 1..8은 `practice` 존재, 모든 step `sources.length >= 1`.
- [ ] **Step 2: 실패 확인** — `npx vitest run` → import 실패로 FAIL.
- [ ] **Step 3: 구현** — `timeline.ts` 함수들. `steps.ts`는 스펙 4절 표대로 9개 Step 골격: slug·title(임시)·messages·nodes는 표의 논리/물리 레인 값, `ms`는 임시값 `[5, 3, 20, 18, 24, 12, 16, 54, 48]`, 모두 `provisional: true`, body/deeper/practice는 한 줄 placeholder, sources는 각 단계의 1차 문서 1개(예: TCP → RFC 9293). nodes 예: dns `[phone-modem, cell-tower, carrier-dns]`, tcp `[phone-modem, cell-tower, carrier-core, aws-seoul]`. 응답 방향 Step(8)의 messages는 `direction: 'down'`.
- [ ] **Step 4: 통과 확인** — `npx vitest run` → all passed.
- [ ] **Step 5: Commit** — `git commit -am "feat: add step data model and timeline math"` (새 파일 `git add` 포함)

---

### Task 3: 용어 마커와 CSS 툴팁

**Files:**
- Create: `src/data/glossary.ts`, `src/lib/terms.ts`, `src/components/Term.astro`, `src/components/Prose.astro`, `tests/unit/terms.test.ts`, `tests/e2e/term.spec.ts`
- Modify: `src/styles/global.css` (tooltip 스타일), `src/pages/index.astro` (임시로 Prose 한 개 렌더)

**Interfaces:**
- Consumes: `steps` (Task 2)
- Produces:

```ts
export const glossary: Record<string, { label: string; ko: string }>;
export type Segment = { type: 'text'; value: string } | { type: 'term'; key: string; label: string };
export function parseTerms(text: string): Segment[];   // [[key]] 또는 [[key|표시텍스트]]; 없는 key면 throw Error(`Unknown term: ${key}`)
```
`<Prose text={string} />` → `<p>`들(빈 줄로 문단 구분), 용어는 `<Term key label />` = `<span class="term" tabindex="0" aria-describedby="term-{key}-{n}">label<span role="tooltip" id=…>ko</span></span>`.

- [ ] **Step 1: 실패하는 테스트** — `terms.test.ts`:

```ts
test('parses plain and labeled markers', () => {
  expect(parseTerms('먼저 [[tcp]] 연결, [[tls|TLS 1.3]]까지')).toEqual([
    { type: 'text', value: '먼저 ' }, { type: 'term', key: 'tcp', label: 'TCP' },
    { type: 'text', value: ' 연결, ' }, { type: 'term', key: 'tls', label: 'TLS 1.3' }, { type: 'text', value: '까지' } ]);
});
test('unknown key throws', () => { expect(() => parseTerms('[[nope]]')).toThrow('Unknown term: nope'); });
test('every marker in steps resolves', () => {
  for (const s of steps) for (const t of [s.body, s.deeper, s.practice ?? '']) expect(() => parseTerms(t)).not.toThrow();
});
```
`term.spec.ts`: `/`에서 첫 `.term`에 `focus()` 후 그 안의 `[role=tooltip]`이 visible; focus 전엔 hidden.
- [ ] **Step 2: 실패 확인** — `npx vitest run tests/unit/terms.test.ts` FAIL, `npx playwright test tests/e2e/term.spec.ts` FAIL.
- [ ] **Step 3: 구현** — 정규식 `/\[\[([a-z0-9-]+)(?:\|([^\]]+))?\]\]/g`로 split. glossary 초기 항목: `tcp, tls, dns, syn, syn-ack, ack, 3-way-handshake, http2, alb, event-loop, libuv, connection-pool, ttfb, keep-alive` (ko는 한 줄, 원본 문장 사용 금지). tooltip CSS: 기본 `opacity:0; pointer-events:none`, `.term:hover [role=tooltip], .term:focus-within [role=tooltip] { opacity:1 }`, 칩 스타일은 시안의 `.term`(blue-50 배경, blue-600 글자, monospace, 점선 밑줄).
- [ ] **Step 4: 통과 확인** — 두 명령 모두 PASS.
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: add glossary term markers with CSS tooltips"`

---

### Task 4: 정적 페이지 조립 (Hero, StepSection, Footer)

**Files:**
- Create: `src/components/Hero.astro`, `src/components/StepSection.astro`, `src/components/Footer.astro`, `tests/e2e/page.spec.ts`
- Modify: `src/pages/index.astro`

**Interfaces:**
- Consumes: `steps`, `computeTimeline` (Task 2), `Prose` (Task 3)
- Produces: 각 섹션 `<section id="step-{index}" data-step={index}>`; 섹션 안 다이어그램 자리 `<div data-diagram>`(Task 5가 island로 채움); 워터폴 자리 `<section id="overview">`(Task 6). Hero는 `total`을 받아 제목 `요청 하나의 {total}ms` 렌더(가칭, 스펙 8절).

- [ ] **Step 1: 실패하는 테스트** — `page.spec.ts`:

```ts
test('renders 9 step sections in order', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('section[data-step]')).toHaveCount(9);
  await expect(page.locator('section[data-step]').first()).toHaveAttribute('id', 'step-0');
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
```
- [ ] **Step 2: 실패 확인** — `npx playwright test tests/e2e/page.spec.ts` FAIL.
- [ ] **Step 3: 구현** — StepSection 레이아웃은 시안 B: `Step N · +XXms` 라벨(`text-accent` tabular-nums), 제목, 요약, `data-diagram` 카드, Prose(body), `<details><summary>＋ 더 깊이 보기</summary>` Prose(deeper), "실무에서는" 박스(왼쪽 3px blue 보더). 섹션 폭 `max-w-2xl mx-auto px-6`. Footer: 섹션별 sources 모음, "숫자에 대하여" 한 문단(측정 환경·조합 방식, Task 9에서 최종 문구), 영감 문구+링크.
- [ ] **Step 4: 통과 확인** — PASS.
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: assemble static page with hero, step sections, footer"`

---

### Task 5: 두 레인 다이어그램 island와 상단 진행 바

**Files:**
- Create: `src/stores/progress.ts`, `src/components/TwoLaneDiagram.tsx`, `src/components/ProgressBar.tsx`, `tests/e2e/diagram.spec.ts`
- Modify: `src/components/StepSection.astro`, `src/pages/index.astro`

**Interfaces:**
- Consumes: `TimelineEntry`, `elapsedAt`, `activeMessageIndex`, `packetPosition` (Task 2); `Step` (Task 2)
- Produces: `export const $elapsedMs = atom<number>(0)`; `<TwoLaneDiagram step={Step} entry={TimelineEntry} client:visible />` — 루트에 `data-active-message={n}`, `data-packet={position}`, 메시지 칩 `data-active="true|false"`; `<ProgressBar total={number} client:load />` — 고정 상단 바, 텍스트 `{Math.round(elapsed)}ms / ~{total}ms`, 루트 `data-elapsed`.

- [ ] **Step 1: 실패하는 테스트** — `diagram.spec.ts`:

```ts
test('scrolling through a step advances message and packet', async ({ page }) => {
  await page.goto('/');
  const d = page.locator('#step-3 [data-active-message]');
  await page.locator('#step-3').scrollIntoViewIfNeeded();
  const before = Number(await d.getAttribute('data-packet'));
  await page.mouse.wheel(0, 400); await page.waitForTimeout(200);
  expect(Number(await d.getAttribute('data-packet'))).toBeGreaterThan(before);
  expect(Number(await page.locator('[data-elapsed]').getAttribute('data-elapsed'))).toBeGreaterThan(0);
});
test('reduced motion snaps packet to a node', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/'); await page.locator('#step-3').scrollIntoViewIfNeeded(); await page.mouse.wheel(0, 300);
  const p = Number(await page.locator('#step-3 [data-packet]').getAttribute('data-packet'));
  expect(Number.isInteger(p)).toBe(true);
});
test('no horizontal overflow at 360px', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 }); await page.goto('/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
```
- [ ] **Step 2: 실패 확인** — FAIL.
- [ ] **Step 3: 구현** — `TwoLaneDiagram`: `useScroll({ target: ref, offset: ['start end', 'end start'] })`의 `scrollYProgress`를 `useMotionValueEvent`로 받아 state 갱신; `useReducedMotion()` → `packetPosition(..., snap)`; 섹션이 뷰포트 중앙을 지나는 동안(`0.25 < progress < 0.75` 구간을 0~1로 재매핑) `$elapsedMs.set(elapsedAt(entry, local))`. 물리 레인 노드는 lucide 아이콘 + 라벨, 점의 left는 `position / (nodeCount-1) * 100%`. 360px에서는 노드 라벨을 `text-[11px]`·줄바꿈 허용, 선 최소 폭 0. SSR 초기 상태는 progress 0(첫 메시지 활성, 점 첫 노드)이어야 Task 4의 no-JS 테스트와 맞는다. `ProgressBar`: `useStore($elapsedMs)`, `sticky top-0` 아님 → `fixed top-0 inset-x-0`.
- [ ] **Step 4: 통과 확인** — 이 파일 + 이전 e2e 전부 PASS (`npx playwright test`).
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: add two-lane diagram island and progress bar"`

---

### Task 6: 워터폴 전체 그림 island

**Files:**
- Create: `src/components/Waterfall.tsx`, `tests/e2e/waterfall.spec.ts`
- Modify: `src/pages/index.astro`

**Interfaces:**
- Consumes: `computeTimeline` 결과, `steps` (Task 2); 섹션 id `step-{index}` (Task 4); `$elapsedMs` (Task 5)
- Produces: `<Waterfall steps={Step[]} entries={TimelineEntry[]} total={number} client:visible />` — 막대마다 `<button data-bar={index} aria-label="{title}로 이동">`.

- [ ] **Step 1: 실패하는 테스트** — `waterfall.spec.ts`:

```ts
test('clicking a bar scrolls to its step', async ({ page }) => {
  await page.goto('/'); await page.locator('#overview').scrollIntoViewIfNeeded();
  await page.locator('[data-bar="3"]').click();
  await expect(page.locator('#step-3')).toBeInViewport();
});
test('after jumping up, elapsed reflects step 3 range', async ({ page }) => {
  await page.goto('/'); await page.locator('#overview').scrollIntoViewIfNeeded();
  await page.locator('[data-bar="3"]').click(); await page.waitForTimeout(800);
  const v = Number(await page.locator('[data-elapsed]').getAttribute('data-elapsed'));
  const { entries } = computeTimeline(steps);
  expect(v).toBeGreaterThanOrEqual(entries[3].start); expect(v).toBeLessThanOrEqual(entries[3].start + entries[3].duration);
});
test('reduced motion uses instant scroll', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/'); await page.locator('#overview').scrollIntoViewIfNeeded();
  await page.locator('[data-bar="0"]').click();
  await expect(page.locator('#step-0')).toBeInViewport({ timeout: 100 });
});
```
- [ ] **Step 2: 실패 확인** — FAIL.
- [ ] **Step 3: 구현** — grid `110px 1fr 54px`(시안), 막대 `left = start/total`, `width = duration/total`, hover/focus 시 `bg-blue-600`, 나머지 `slate-300`. 클릭 → `document.getElementById('step-'+i)?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' })`. 제목 "한눈에 다시 보기", 상단 `POST /api/orders · 총 ~{total}ms`.
- [ ] **Step 4: 통과 확인** — `npx playwright test` 전부 PASS.
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: add waterfall overview with scroll-to-step"`

---

### Task 7: 콘텐츠 — Step 3(TCP) 완성본 + 1차 검수

**Files:**
- Modify: `src/data/steps.ts` (index 3), `src/data/glossary.ts`

**Interfaces:**
- Consumes: `Step` 필드 규칙 (Task 2), 마커 규칙 (Task 3)

- [ ] **Step 1: 집필** — Step 3의 title·summary·body(2~4문장)·deeper(무선 구간 → 코어망 → 백본 → 리전, HTTP/3는 TCP를 건너뛴다는 한 줄)·practice(`ECONNREFUSED`, keep-alive로 재사용 시 생략)·messages·nodes·sources(RFC 9293 등). 사실 주장마다 sources에 대응 출처가 있어야 한다. 해요체, 원본 표현 금지.
- [ ] **Step 2: 검증** — `npx vitest run && npx playwright test` PASS.
- [ ] **Step 3: Commit** — `git commit -am "content: write step 3 (TCP) draft"`
- [ ] **Step 4: 사용자 검수 (CHECKPOINT)** — `npm run preview`로 띄워 Step 3을 보여주고 톤·깊이 피드백을 받는다. 피드백을 반영하고 커밋한 뒤에만 Task 8로 간다.

---

### Task 8: 콘텐츠 — 나머지 Step, Hero, Footer + 2차 검수

**Files:**
- Modify: `src/data/steps.ts` (index 0–2, 4–8), `src/data/glossary.ts`, `src/components/Hero.astro`, `src/components/Footer.astro`

- [ ] **Step 1: 집필** — Task 7에서 확정된 톤으로 나머지 8개 Step. 스펙 4절 표의 실무 연결 항목을 practice에 모두 반영(`Cache-Control`, `ENOTFOUND`, 인증서 오류, 502/504, blocking 코드, pool 고갈·느린 쿼리, TTFB). Hero: 시나리오 한 문단 + 스크롤 유도. glossary에 새 key 추가.
- [ ] **Step 2: 검증** — `npx vitest run && npx playwright test` PASS (unknown term 없음).
- [ ] **Step 3: Commit** — `git commit -am "content: write remaining steps, hero, footer"`
- [ ] **Step 4: 사용자 검수 (CHECKPOINT)** — 전체 초안 사실·문장 검토. 반영 후 커밋.

---

### Task 9: ms 근거 확보와 provisional 제거

**Files:**
- Create: `scripts/measure.sh`, `docs/numbers.md`, `scripts/check-release.ts`, `tests/unit/release.test.ts`
- Modify: `src/data/steps.ts` (ms, provisional), `src/components/Footer.astro` ("숫자에 대하여"), `package.json` (`check:release`)

**Interfaces:**
- Produces: `export function provisionalSteps(steps: Step[]): number[]` (provisional인 index 목록); `npm run check:release` → 목록이 비어 있지 않으면 exit 1.

- [ ] **Step 1: 실패하는 테스트** — `release.test.ts`: `provisionalSteps([{index:0,provisional:true},{index:1,provisional:false}] as Step[])`가 `[0]`.
- [ ] **Step 2: 실패 확인 → 구현 → 통과** — `npx vitest run tests/unit/release.test.ts`.
- [ ] **Step 3: 측정** — `measure.sh`: `curl -so /dev/null -w '%{time_namelookup} %{time_connect} %{time_appconnect} %{time_starttransfer}\n' https://ec2.ap-northeast-2.amazonaws.com` 10회, 중앙값 출력. 로컬 Node(`http` 서버 + `pg` 쿼리) 처리 시간은 docs에 방법과 함께 기록. 모바일 무선 구간은 공개 자료(출처 URL)로 보정. 결과·환경·계산을 `docs/numbers.md`에.
- [ ] **Step 4: 반영** — steps.ts ms 교체, 모두 `provisional: false`, Footer "숫자에 대하여"에 "이 맥(유선/Wi-Fi) 측정 + 공개 자료 조합, 환경에 따라 크게 달라짐" 명시. 합계가 200에서 크게 벗어나면 Hero 제목은 자동으로 실제 합계를 표시(Task 4).
- [ ] **Step 5: 검증** — `npm run check:release && npx vitest run && npx playwright test` 모두 PASS.
- [ ] **Step 6: Commit** — `git add -A && git commit -m "data: replace provisional timings with measured values"`

---

### Task 10: 배포 준비와 Vercel 배포

**Files:**
- Modify: `src/layouts/Base.astro` (OG 메타: title, description, og:image), Create: `public/og.png`(1200×630, 디자인 토큰으로 제작), `README.md`(로컬 실행·측정 방법)

- [ ] **Step 1: 메타 확인 테스트** — `tests/e2e/smoke.spec.ts`에 `meta[property="og:title"]`, `og:description`, `og:image` 존재 assertion 추가 → FAIL → 구현 → PASS.
- [ ] **Step 2: 전체 검증** — `npm run build && npm run check:release && npx vitest run && npx playwright test` PASS, `dist/index.html`에 Step 제목 텍스트가 들어 있는지 `grep` 확인.
- [ ] **Step 3: Commit** — `git add -A && git commit -m "chore: add OG meta and README"`
- [ ] **Step 4: 배포 (사용자 확인 후)** — GitHub 레포 생성·push와 Vercel 연결은 외부 공개 작업이므로 사용자에게 레포 공개 여부·이름·도메인을 확인한 뒤 진행. Vercel은 Astro 정적 출력을 자동 감지한다.
