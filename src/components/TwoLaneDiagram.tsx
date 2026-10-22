import { useRef, useState } from 'react';
import { useMotionValueEvent, useReducedMotion, useScroll } from 'motion/react';
import {
  Building2, Cloud, Cpu, Database, Hand, HardDrive, MemoryStick,
  Monitor, Network, RadioTower, Router, Server, Smartphone, type LucideIcon,
} from 'lucide-react';
import type { Step } from '../data/types';
import { activeMessageIndex, elapsedAt, packetPosition, unrollPath, type TimelineEntry } from '../lib/timeline';
import { $elapsedMs } from '../stores/progress';

// steps.ts에서 쓰는 아이콘만 가져온다(전체 import는 번들을 키운다)
const ICONS: Record<string, LucideIcon> = {
  Building2, Cloud, Cpu, Database, Hand, HardDrive, MemoryStick,
  Monitor, Network, RadioTower, Router, Server, Smartphone,
};

type Props = { step: Step; entry: TimelineEntry };

export default function TwoLaneDiagram({ step, entry }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const reduced = useReducedMotion() ?? false;
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, 'change', () => {
    const section = ref.current?.closest('section');
    if (!section) return;
    const rect = section.getBoundingClientRect();
    const local = (window.innerHeight / 2 - rect.top) / rect.height;
    setProgress(Math.min(1, Math.max(0, local)));
    if (local >= 0 && local <= 1) $elapsedMs.set(elapsedAt(entry, local));
  });

  const active = activeMessageIndex(progress, step.messages.length);
  const { path, segments } = unrollPath(step.nodes, step.messages.map((m) => m.direction));
  const packet = packetPosition(progress, path.length, reduced);
  const goingDown = step.messages[active].direction === 'down';
  const n = path.length;
  // 노드 i의 중심은 (i + 0.5) / n 지점. 선은 첫 노드 중심에서 끝 노드 중심까지.
  const center = (i: number) => `${((i + 0.5) / n) * 100}%`;

  return (
    <div ref={ref} data-active-message={active} data-packet={packet} className="px-4 py-2 sm:px-5">
      <div className="grid grid-cols-1 items-center gap-2 border-b border-dashed border-slate-200 py-4 sm:grid-cols-[3rem_1fr] sm:gap-3 dark:border-dark-border">
        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">논리</span>
        <div className="flex flex-wrap gap-1.5">
          {step.messages.map((m, i) => (
            <span
              key={m.label}
              data-active={i === active}
              className={`rounded-lg px-2 py-1 font-mono text-xs transition-colors ${
                i <= active
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300'
                  : 'bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-500'
              }`}
            >
              {m.direction === 'down' ? `← ${m.label}` : `${m.label} →`}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-2 py-4 sm:grid-cols-[3rem_1fr] sm:gap-3">
        <span className="text-xs font-semibold text-slate-500 sm:mt-2.5 dark:text-slate-400">물리</span>
        <div className="relative min-w-0">
          <div
            className="absolute top-3 h-0.5 bg-slate-200 sm:top-[1.0625rem] dark:bg-dark-border"
            style={{ left: center(0), right: `${(0.5 / n) * 100}%` }}
          >
            <span
              aria-hidden="true"
              className={`absolute -top-1 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-blue-600 shadow-[0_0_0_4px_rgba(37,99,235,0.15)] dark:bg-blue-400 ${
                reduced ? '' : 'transition-[left] duration-150 ease-out'
              }`}
              style={{ left: `${(packet / (n - 1)) * 100}%` }}
            />
          </div>
          <ol className="relative grid" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
            {path.map((node, i) => {
              const Icon = ICONS[node.icon] ?? Server;
              return (
                <li key={`${node.id}-${i}`} className="flex min-w-0 flex-col items-center gap-1">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white text-slate-600 ring-1 ring-slate-200 sm:h-[2.125rem] sm:w-[2.125rem] sm:rounded-[10px] dark:bg-dark-card dark:text-slate-300 dark:ring-dark-border">
                    <Icon className="h-3 w-3 sm:h-4 sm:w-4" strokeWidth={1.75} aria-hidden="true" />
                  </span>
                  <span className="hidden max-w-full break-keep text-center text-[11px] leading-tight text-slate-500 sm:block dark:text-slate-400">
                    {node.label}
                  </span>
                </li>
              );
            })}
          </ol>
          {segments.length > 1 && (
            <div className="relative mt-2 h-4">
              {segments.map((seg, i) => (
                <span
                  key={step.messages[i].label}
                  className={`absolute -translate-x-1/2 whitespace-nowrap font-mono text-[10px] sm:text-[11px] ${
                    i === active ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'
                  }`}
                  style={{ left: `${(((seg.start + seg.end) / 2 + 0.5) / n) * 100}%` }}
                >
                  {step.messages[i].label}
                </span>
              ))}
            </div>
          )}
          <p data-current-node className="mt-2 text-xs text-slate-500 sm:hidden dark:text-slate-400">
            지금: {path[Math.round(packet)].label}
          </p>
        </div>
      </div>
      <p className="sr-only">
        {goingDown ? '응답이 돌아오는 중' : '요청이 가는 중'}: {step.messages[active].label}
      </p>
    </div>
  );
}
