import type { Step } from '../data/types';

/** 아직 임시값(provisional)인 Step의 index 목록. 출시 전에는 비어 있어야 한다. */
export function provisionalSteps(steps: Step[]): number[] {
  return steps.filter((s) => s.provisional).map((s) => s.index);
}
