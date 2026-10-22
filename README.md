# http-journey

주니어 개발자를 위한 한국어 인터랙티브 페이지: HTTP 요청 하나가 버튼을 누른 순간부터 화면이 바뀌기까지 거치는 길을 단계마다 **논리적(무슨 메시지가 오가는지)**, **물리적(실제로 어떤 장비를 지나는지)** 상황으로 보여준다.

- 설계: `docs/superpowers/specs/2026-10-22-http-journey-design.md`
- 단계별 ms 근거: `docs/numbers.md`

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
