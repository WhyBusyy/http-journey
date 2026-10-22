import { expect, test } from 'vitest';
import { glossary } from '../../src/data/glossary';

test('full names are real expansions, not invented "Error:" prefixes', () => {
  for (const [key, g] of Object.entries(glossary)) expect(g.full ?? '', key).not.toMatch(/^Error:/);
});
