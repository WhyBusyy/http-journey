import { expect, test } from 'vitest';
import type { Step } from '../../src/data/types';
import { activeMessageIndex, computeTimeline, elapsedAt, messageLegs, packetPosition, rowProgress } from '../../src/lib/timeline';

const steps = [{ ms: 5 }, { ms: 20 }, { ms: 18 }] as Step[];

test('computeTimeline accumulates starts', () => {
  expect(computeTimeline(steps)).toEqual({
    total: 43,
    entries: [
      { index: 0, start: 0, duration: 5 },
      { index: 1, start: 5, duration: 20 },
      { index: 2, start: 25, duration: 18 },
    ],
  });
});

test('elapsedAt clamps progress', () => {
  const e = { index: 1, start: 5, duration: 20 };
  expect(elapsedAt(e, -0.5)).toBe(5);
  expect(elapsedAt(e, 0.5)).toBe(15);
  expect(elapsedAt(e, 2)).toBe(25);
});

test('activeMessageIndex splits evenly', () => {
  expect(activeMessageIndex(0, 3)).toBe(0);
  expect(activeMessageIndex(0.34, 3)).toBe(1);
  expect(activeMessageIndex(1, 3)).toBe(2);
});

test('packetPosition moves one way along a row, continuous vs snap', () => {
  expect(packetPosition(0.5, 4, false)).toBeCloseTo(1.5);
  expect(packetPosition(0.5, 4, true)).toBe(2);
  expect(packetPosition(-1, 4, false)).toBe(0);
  expect(packetPosition(9, 4, true)).toBe(3);
});

const n = (id: string) => ({ id, label: id, icon: 'Server' });
const ids = (leg: { id: string }[]) => leg.map((x) => x.id).join(',');

test('messageLegs gives one row per message, sender on the left', () => {
  const legs = messageLegs([n('a'), n('b'), n('c')], ['up', 'down', 'up']);
  expect(legs.map(ids)).toEqual(['a,b,c', 'c,b,a', 'a,b,c']);
});

test('rowProgress picks the active row and how far along it the packet is', () => {
  expect(rowProgress(0, 3)).toEqual({ row: 0, t: 0 });
  expect(rowProgress(0.5, 2)).toEqual({ row: 1, t: 0 });
  const r = rowProgress(0.5, 3);
  expect(r.row).toBe(1);
  expect(r.t).toBeCloseTo(0.5);
  expect(rowProgress(1, 3)).toEqual({ row: 2, t: 1 });
});
