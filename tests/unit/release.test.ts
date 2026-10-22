import { expect, test } from 'vitest';
import type { Step } from '../../src/data/types';
import { provisionalSteps } from '../../src/lib/release';

test('provisionalSteps lists indexes still using placeholder timings', () => {
  expect(provisionalSteps([{ index: 0, provisional: true }, { index: 1, provisional: false }] as Step[])).toEqual([0]);
});
