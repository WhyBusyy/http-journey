import { glossary } from '../data/glossary';

export type Segment = { type: 'text'; value: string } | { type: 'term'; key: string; label: string };

const MARKER = /\[\[([a-z0-9-]+)(?:\|([^\]]+))?\]\]/g;

export function parseTerms(text: string): Segment[] {
  const segments: Segment[] = [];
  let last = 0;
  for (const m of text.matchAll(MARKER)) {
    const [whole, key, label] = m;
    const entry = glossary[key];
    if (!entry) throw new Error(`Unknown term: ${key}`);
    if (m.index > last) segments.push({ type: 'text', value: text.slice(last, m.index) });
    segments.push({ type: 'term', key, label: label ?? entry.label });
    last = m.index + whole.length;
  }
  if (last < text.length) segments.push({ type: 'text', value: text.slice(last) });
  return segments;
}
