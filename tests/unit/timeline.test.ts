import { expect, test } from 'vitest';
import type { Step } from '../../src/data/types';
import { activeMessageIndex, arrowPosition, computeTimeline, elapsedAt, isRoundTrip, rowProgress } from '../../src/lib/timeline';

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

test('rowProgress picks the active row and how far along it the packet is', () => {
  expect(rowProgress(0, 3)).toEqual({ row: 0, t: 0 });
  expect(rowProgress(0.5, 2)).toEqual({ row: 1, t: 0 });
  const r = rowProgress(0.5, 3);
  expect(r.row).toBe(1);
  expect(r.t).toBeCloseTo(0.5);
  expect(rowProgress(1, 3)).toEqual({ row: 2, t: 1 });
});

test('isRoundTrip is true only when a response comes back', () => {
  expect(isRoundTrip(['up', 'down'])).toBe(true);
  expect(isRoundTrip(['up', 'down', 'up'])).toBe(true);
  expect(isRoundTrip(['up', 'up'])).toBe(false);
  expect(isRoundTrip(['down'])).toBe(false);
});

test('arrowPosition follows the arrow: up runs left→right, down runs right→left', () => {
  expect(arrowPosition(0.25, 'up', 5)).toBeCloseTo(1);
  expect(arrowPosition(0.25, 'down', 5)).toBeCloseTo(3);
  expect(arrowPosition(1, 'down', 5)).toBeCloseTo(0);
  expect(arrowPosition(0.3, 'up', 4, true)).toBe(1);
  expect(arrowPosition(-1, 'up', 4)).toBe(0);
});
