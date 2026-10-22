import { useRef, useState } from 'react';
import { useMotionValueEvent, useReducedMotion, useScroll } from 'motion/react';
import {
  Building2, Cloud, Cpu, Database, Hand, HardDrive, MemoryStick,
  Monitor, Network, RadioTower, Router, Server, Smartphone, type LucideIcon,
} from 'lucide-react';
import type { Step } from '../data/types';
import { activeMessageIndex, elapsedAt, messageLegs, packetPosition, rowProgress, type TimelineEntry } from '../lib/timeline';
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
  const legs = messageLegs(step.nodes, step.messages.map((m) => m.direction));
  const { row, t } = rowProgress(progress, legs.length);
  const n = step.nodes.length;
  const position = packetPosition(t, n, reduced);
  // 줄을 이어 센 누적 위치(아래로 스크롤하면 항상 커진다)
  const packet = row * (n - 1) + position;
  const goingDown = step.messages[active].direction === 'down';
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
        <span className="text-xs font-semibold text-slate-500 sm:mt-6 dark:text-slate-400">물리</span>
        <div className="min-w-0 space-y-3">
          {legs.map((leg, li) => {
            const state = li < row ? 'done' : li === row ? 'active' : 'pending';
            return (
              <div
                key={step.messages[li].label}
                data-leg={li}
                data-state={state}
                className={`transition-opacity ${state === 'active' ? '' : state === 'done' ? 'opacity-50' : 'opacity-30'}`}
              >
                {legs.length > 1 && (
                  <p className={`mb-1.5 font-mono text-[11px] ${state === 'active' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>
                    {step.messages[li].label}
                  </p>
                )}
                <div className="relative">
                  <div className="absolute top-3 h-0.5 bg-slate-200 sm:top-[1.0625rem] dark:bg-dark-border" style={{ left: center(0), right: `${(0.5 / n) * 100}%` }}>
                    {state === 'active' && (
                      <span
                        aria-hidden="true"
                        className={`absolute -top-1 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-blue-600 shadow-[0_0_0_4px_rgba(37,99,235,0.15)] dark:bg-blue-400 ${
                          reduced ? '' : 'transition-[left] duration-150 ease-out'
                        }`}
                        style={{ left: `${(position / (n - 1)) * 100}%` }}
                      />
                    )}
                  </div>
                  <ol className="relative grid" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
                    {leg.map((node) => {
                      const Icon = ICONS[node.icon] ?? Server;
                      return (
                        <li key={node.id} className="flex min-w-0 flex-col items-center gap-1">
                          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white text-slate-600 ring-1 ring-slate-200 sm:h-[2.125rem] sm:w-[2.125rem] sm:rounded-[10px] dark:bg-dark-card dark:text-slate-300 dark:ring-dark-border">
                            <Icon className="h-3 w-3 sm:h-4 sm:w-4" strokeWidth={1.75} aria-hidden="true" />
                          </span>
                          <span className="max-w-full break-keep text-center text-[10px] leading-tight text-slate-500 sm:text-[11px] dark:text-slate-400">
                            {node.label}
                          </span>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <p className="sr-only">
        {goingDown ? '응답이 돌아오는 중' : '요청이 가는 중'}: {step.messages[active].label}
      </p>
    </div>
  );
}
