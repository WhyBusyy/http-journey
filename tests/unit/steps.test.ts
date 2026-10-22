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

test('physical lane holds only hardware and media, never software', () => {
  const software = /\bOS\b|브라우저|kernel|libuv|thread|Postgres|Node\.js/i;
  for (const s of steps) for (const n of s.nodes) expect(n.label, `${s.slug}: ${n.label}`).not.toMatch(software);
});

test('physical nodes run phone side (left) to server side (right), so the response ends at the phone', () => {
  const response = steps.find((s) => s.slug === 'response')!;
  expect(response.messages.every((m) => m.direction === 'down')).toBe(true);
  expect(response.nodes[0].id).toBe('phone-screen');
  expect(response.nodes.at(-1)!.id).toBe('aws-seoul');
});

test('steps 1..8 have a practice note', () => {
  for (const s of steps.slice(1)) expect(s.practice, s.slug).toBeTruthy();
});

test('every step cites at least one source', () => {
  for (const s of steps) expect(s.sources.length, s.slug).toBeGreaterThanOrEqual(1);
});
