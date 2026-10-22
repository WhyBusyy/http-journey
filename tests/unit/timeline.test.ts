import { expect, test } from 'vitest';
import type { Step } from '../../src/data/types';
import { activeMessageIndex, computeTimeline, elapsedAt, packetPosition } from '../../src/lib/timeline';

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

test('packetPosition continuous vs snap', () => {
  expect(packetPosition(0.5, 4, false)).toBeCloseTo(1.5);
  expect(packetPosition(0.5, 4, true)).toBe(2);
  expect(packetPosition(-1, 4, false)).toBe(0);
  expect(packetPosition(9, 4, true)).toBe(3);
});
