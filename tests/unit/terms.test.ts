import { expect, test } from 'vitest';
import { steps } from '../../src/data/steps';
import { parseTerms } from '../../src/lib/terms';

test('parses plain and labeled markers', () => {
  expect(parseTerms('먼저 [[tcp]] 연결, [[tls|TLS 1.3]]까지')).toEqual([
    { type: 'text', value: '먼저 ' },
    { type: 'term', key: 'tcp', label: 'TCP' },
    { type: 'text', value: ' 연결, ' },
    { type: 'term', key: 'tls', label: 'TLS 1.3' },
    { type: 'text', value: '까지' },
  ]);
});

test('unknown key throws', () => {
  expect(() => parseTerms('[[nope]]')).toThrow('Unknown term: nope');
});

test('every marker in steps resolves', () => {
  for (const s of steps) {
    for (const t of [s.body, s.deeper, s.practice ?? '']) expect(() => parseTerms(t)).not.toThrow();
  }
});
