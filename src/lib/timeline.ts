import type { Step } from '../data/types';

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

export function packetPosition(progress: number, nodeCount: number, snap: boolean): number {
  const position = clamp01(progress) * (nodeCount - 1);
  return snap ? Math.round(position) : position;
}
