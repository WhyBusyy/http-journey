import type { LogicalMessage, Step } from '../data/types';

export type TimelineEntry = { index: number; start: number; duration: number };

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

export function computeTimeline(steps: Pick<Step, 'ms'>[]): { entries: TimelineEntry[]; total: number } {
  let start = 0;
  const entries = steps.map((s, index) => {
    const entry = { index, start, duration: s.ms };
    start += s.ms;
    return entry;
  });
  return { entries, total: start };
}

export function elapsedAt(entry: TimelineEntry, progress: number): number {
  return entry.start + entry.duration * clamp01(progress);
}

export function activeMessageIndex(progress: number, count: number): number {
  return Math.min(count - 1, Math.floor(clamp01(progress) * count));
}

// 다이어그램 윗변이 뷰포트의 START에서 END 지점까지 올라가는 동안 진행하고, 앞뒤로는 멈춰 있는다(여유 구간).
const START = 0.7;
const END = 0.2;

/** 다이어그램 자체의 위치로 계산한 진행값. 끝나는 순간에도 다이어그램 전체가 화면 안에 남는다. */
export function diagramProgress(top: number, viewportHeight: number): number {
  return clamp01((START * viewportHeight - top) / ((START - END) * viewportHeight));
}

/** 응답이 돌아오는 단계(가는 메시지와 오는 메시지가 섞임)인지. 이런 단계는 시퀀스 다이어그램으로 그린다. */
export function isRoundTrip(directions: LogicalMessage['direction'][]): boolean {
  return directions.includes('up') && directions.includes('down');
}

/**
 * 화살표(또는 한 줄) 위 패킷 점의 위치. 노드는 폰 쪽(0) → 서버 쪽(nodeCount-1) 순서로 고정이고,
 * up은 왼→오, down(응답)은 오→왼으로 움직인다.
 */
export function arrowPosition(t: number, direction: LogicalMessage['direction'], nodeCount: number, snap = false): number {
  const along = direction === 'down' ? 1 - clamp01(t) : clamp01(t);
  const position = along * (nodeCount - 1);
  return snap ? Math.round(position) : position;
}

/** 전체 진행값을 지금 줄(row)과 그 줄 안의 진행값(t, 0~1)으로 나눈다. */
export function rowProgress(progress: number, count: number): { row: number; t: number } {
  const p = clamp01(progress);
  const row = activeMessageIndex(p, count);
  return { row, t: clamp01(p * count - row) };
}
