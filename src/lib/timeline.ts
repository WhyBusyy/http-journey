import type { LogicalMessage, PhysicalNode, Step } from '../data/types';

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

/** 한 줄 안에서 패킷 점의 위치. 항상 왼쪽(0) → 오른쪽(nodeCount-1)으로만 간다. */
export function packetPosition(t: number, nodeCount: number, snap: boolean): number {
  const position = clamp01(t) * (nodeCount - 1);
  return snap ? Math.round(position) : position;
}

/** 메시지마다 한 줄. nodes는 폰 쪽 → 서버 쪽 순서이고, down 메시지는 뒤집어서 보내는 쪽이 왼쪽에 오게 한다. */
export function messageLegs(nodes: PhysicalNode[], directions: LogicalMessage['direction'][]): PhysicalNode[][] {
  return directions.map((d) => (d === 'down' ? [...nodes].reverse() : nodes));
}

/** 전체 진행값을 지금 줄(row)과 그 줄 안의 진행값(t, 0~1)으로 나눈다. */
export function rowProgress(progress: number, count: number): { row: number; t: number } {
  const p = clamp01(progress);
  const row = activeMessageIndex(p, count);
  return { row, t: clamp01(p * count - row) };
}
