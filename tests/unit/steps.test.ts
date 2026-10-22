import { expect, test } from 'vitest';
import { steps } from '../../src/data/steps';

test('has 9 steps indexed 0..8 in order', () => {
  expect(steps.map((s) => s.index)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
});

test('slugs are unique', () => {
  expect(new Set(steps.map((s) => s.slug)).size).toBe(steps.length);
});

test('every step has two lanes worth of data', () => {
  for (const s of steps) {
    expect(s.nodes.length, s.slug).toBeGreaterThanOrEqual(2);
    expect(s.messages.length, s.slug).toBeGreaterThanOrEqual(1);
  }
});

test('steps 1..8 have a practice note', () => {
  for (const s of steps.slice(1)) expect(s.practice, s.slug).toBeTruthy();
});

test('every step cites at least one source', () => {
  for (const s of steps) expect(s.sources.length, s.slug).toBeGreaterThanOrEqual(1);
});
