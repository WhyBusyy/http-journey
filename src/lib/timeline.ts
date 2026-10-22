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

/** 펼쳐진 경로(unrollPath)에서 패킷 점의 위치. 항상 왼쪽(0) → 오른쪽(pathLength-1)으로만 간다. */
export function packetPosition(progress: number, pathLength: number, snap: boolean): number {
  const position = clamp01(progress) * (pathLength - 1);
  return snap ? Math.round(position) : position;
}

export type PathSegment = { start: number; end: number };

/**
 * 메시지마다 보내는 쪽 → 받는 쪽 순서로 노드를 이어 붙여, 왕복도 한 방향의 줄로 펼친다.
 * nodes는 폰 쪽 → 서버 쪽 순서이고, down 메시지는 그 순서를 뒤집어 붙인다. 이음매 노드는 한 번만 둔다.
 */
export function unrollPath(
  nodes: PhysicalNode[],
  directions: LogicalMessage['direction'][],
): { path: PhysicalNode[]; segments: PathSegment[] } {
  const path: PhysicalNode[] = [];
  const segments: PathSegment[] = [];
  for (const direction of directions) {
    const leg = direction === 'down' ? [...nodes].reverse() : nodes;
    const start = Math.max(path.length - 1, 0);
    path.push(...(path.length ? leg.slice(1) : leg));
    segments.push({ start, end: path.length - 1 });
  }
  return { path, segments };
}
