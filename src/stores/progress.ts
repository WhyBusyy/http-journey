import { atom } from 'nanostores';

/** 지금 보고 있는 지점까지 요청이 흘러온 시간(ms). 뷰포트 중앙선을 품은 Step의 다이어그램만 갱신한다. */
export const $elapsedMs = atom<number>(0);
