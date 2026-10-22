import { steps } from '../src/data/steps.ts';
import { provisionalSteps } from '../src/lib/release.ts';

const pending = provisionalSteps(steps);
if (pending.length) {
  console.error(`임시 ms 값이 남은 Step: ${pending.join(', ')}`);
  process.exit(1);
}
console.log('모든 Step의 ms에 근거가 있습니다.');
