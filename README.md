# http-journey

주니어 개발자를 위한 한국어 인터랙티브 페이지: HTTP 요청 하나가 버튼을 누른 순간부터 화면이 바뀌기까지 거치는 길을 단계마다 **논리적(무슨 메시지가 오가는지)**, **물리적(실제로 어떤 장비를 지나는지)** 상황으로 보여준다.

- 설계: `docs/superpowers/specs/2026-10-22-http-journey-design.md`
- 단계별 ms 근거: `docs/numbers.md`

## 스택과 선택 이유

| 영역 | 선택 | 이유 |
|---|---|---|
| 프레임워크 | **Astro 7** (정적 출력) | 글이 주인공인 단일 페이지다. 본문은 빌드할 때 JS 없는 HTML로 만들고, 움직이는 부분만 JS를 보낸다. |
| 인터랙션 | **React islands** | 두 레인 다이어그램과 상단 진행 바만 React로 hydrate한다. 다이어그램은 `client:visible`이라 화면에 보일 때 깨어난다. |
| 스타일 | **Tailwind CSS 4** | 포트폴리오(portfolio.whybusyy.com)의 디자인 토큰(Pretendard, slate, blue-600, 다크 모드)을 그대로 옮기기 쉽다. |
| 스크롤 연동 | **motion** (`useScroll`, `useReducedMotion`) | 스크롤 위치를 rAF 단위로 받아 다이어그램 진행값을 계산하고, 모션 줄이기 설정을 한 줄로 존중한다. |
| island 간 상태 | **nanostores** | island끼리는 React 트리가 분리돼 있다. 경과 ms 하나만 공유하면 되므로 가장 작은 store를 골랐다. |
| 아이콘 | **lucide-react** (필요한 것만 import) | 일관된 선 아이콘 세트. 전체 import 대신 쓰는 아이콘만 골라 번들을 줄인다. |
| 폰트 | **Pretendard** dynamic subset | 한글 글리프를 필요한 조각만 받아 첫 화면을 가볍게 한다. |
| 테스트 | **Vitest** + **Playwright** | 타임라인 계산 같은 순수 함수는 Vitest로, 스크롤·툴팁·360px 폭·JS 없는 상태·reduced-motion은 실제 브라우저(Playwright)로 검증한다. |
| 배포 | **Vercel** (어댑터 없음) | 정적 사이트라 `@astrojs/vercel` 어댑터가 필요 없다. Vercel이 Astro를 자동 감지한다. |
| 런타임 | **Node 22.23.4** (`mise.toml`) | Astro 7.4가 요구하는 최소 버전. 프로젝트에만 고정해 전역 Node는 건드리지 않는다. |

### 왜 Astro인가 (검토한 대안)

| 후보 | 장점 | 이 페이지에서의 단점 |
|---|---|---|
| **Astro** (채택) | 본문이 순수 HTML이라 가장 가볍고 빠르다. 검색·링크 미리보기(OG)가 기본으로 된다. | island끼리 상태를 공유하려면 store가 하나 필요하다. |
| Next.js | 포트폴리오와 같은 스택이라 익숙하다. SSG/OG도 된다. | 서버 기능·라우팅·데이터 fetch가 필요 없는 정적 페이지 하나에는 React 런타임과 hydration 비용이 크다. |
| Vite + React | 설정이 가장 단순하다. | SPA라 HTML이 빈 껍데기가 되어 검색과 링크 미리보기가 약하다. |

핵심 기준은 **속도**와 **글 중심 구조**였다. "요청이 빠르다"는 이야기를 하는 페이지가 모바일에서 느리면 안 된다.

### JS를 덜 쓰기 위한 결정

- **용어 툴팁**: 기본은 CSS(`:hover`, `:focus-within`)로 열린다. 칩 바로 아래에 화면 안으로 맞춰 띄우는 위치 계산만 작은 스크립트(`src/scripts/term-tooltip.ts`)가 맡고, JS가 없으면 CSS 방식으로 동작한다.
- **워터폴**: 막대가 `<a href="#step-N">` 링크라 React island가 아니다. JS 없이도, hydration 전에도 이동한다. 부드러운 스크롤과 reduced-motion 대응은 CSS `scroll-behavior`가 맡는다.
- **콘텐츠 데이터**: Step 본문·ms·출처는 `src/data/steps.ts` 한 곳에 있고, 빌드 때 HTML로 들어간다. JS를 끄거나 로딩 전이어도 본문과 다이어그램 초기 상태가 읽힌다.

## 개발

Node 22.23.4 이상이 필요하다(`mise.toml`에 고정).

```bash
mise install            # 또는 Node 22.23.4+ 준비
npm install
npm run dev             # 개발 서버
npm run build           # dist/ 정적 출력
```

## 검사

```bash
npm test                # Vitest 단위 테스트
npm run test:e2e        # Playwright (빌드 후 preview 서버 대상)
npm run check:release   # 임시(provisional) ms가 남아 있으면 실패
```

## 콘텐츠 수정

- Step 본문·ms·출처: `src/data/steps.ts`. 용어는 `[[key]]` 또는 `[[key|표시 텍스트]]`로 쓰고 `src/data/glossary.ts`에 등록한다(없는 key는 빌드·테스트에서 실패).
- ms를 바꾸면 `docs/numbers.md`의 근거도 함께 고친다. 합계가 바뀌면 `scripts/og/og.html`의 숫자를 고치고 `node scripts/og/render.mjs`로 `public/og.png`를 다시 만든다.
- 측정: `scripts/measure.sh [host] [runs]`

## 영감

The Nodebook의 [200ms 시각화](https://200ms.thenodebook.com)에서 아이디어를 얻었다. 문장·구성·디자인·코드는 이 프로젝트에서 새로 만들었다.
