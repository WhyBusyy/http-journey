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

/**
 * 물리 레인에서 패킷 점의 위치(0 = 폰 쪽 첫 노드, nodeCount-1 = 서버 쪽 끝 노드).
 * 진행 구간을 메시지 수로 나누고, 지금 메시지가 up이면 왼→오, down이면 오→왼으로 이동한다.
 */
export function packetPosition(
  progress: number,
  directions: LogicalMessage['direction'][],
  nodeCount: number,
  snap: boolean,
): number {
  const p = clamp01(progress);
  const i = activeMessageIndex(p, directions.length);
  const t = clamp01(p * directions.length - i);
  const along = directions[i] === 'down' ? 1 - t : t;
  const position = along * (nodeCount - 1);
  return snap ? Math.round(position) : position;
}
