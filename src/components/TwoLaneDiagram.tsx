import { useRef, useState } from 'react';
import { useMotionValueEvent, useReducedMotion, useScroll } from 'motion/react';
import {
  Building2, Cloud, Cpu, Database, Hand, HardDrive, MemoryStick,
  Monitor, Network, RadioTower, Router, Server, Smartphone, type LucideIcon,
} from 'lucide-react';
import type { Step } from '../data/types';
import { activeMessageIndex, elapsedAt, packetPosition, type TimelineEntry } from '../lib/timeline';
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
  const packet = packetPosition(progress, step.messages.map((m) => m.direction), step.nodes.length, reduced);
  const goingDown = step.messages[active].direction === 'down';
  const left = `${(packet / (step.nodes.length - 1)) * 100}%`;

  return (
    <div ref={ref} data-active-message={active} data-packet={packet} className="px-4 py-2 sm:px-5">
      <div className="grid grid-cols-[3rem_1fr] items-center gap-3 border-b border-dashed border-slate-200 py-4 dark:border-dark-border">
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

      <div className="grid grid-cols-[3rem_1fr] items-center gap-3 py-4">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">물리</span>
        <div className="relative min-w-0">
          {/* 노드를 잇는 선: 첫 노드와 마지막 노드의 중심 사이 */}
          <div className="absolute left-[1.0625rem] right-[1.0625rem] top-[1.0625rem] h-0.5 bg-slate-200 dark:bg-dark-border">
            <span
              aria-hidden="true"
              className={`absolute -top-1 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-blue-600 shadow-[0_0_0_4px_rgba(37,99,235,0.15)] dark:bg-blue-400 ${
                reduced ? '' : 'transition-[left] duration-150 ease-out'
              }`}
              style={{ left }}
            />
          </div>
          <ol className="relative flex justify-between gap-1">
            {step.nodes.map((n) => {
              const Icon = ICONS[n.icon] ?? Server;
              return (
                <li key={n.id} className="flex min-w-0 flex-1 flex-col items-center gap-1 first:items-start last:items-end">
                  <span className="flex h-[2.125rem] w-[2.125rem] items-center justify-center rounded-[10px] bg-white text-slate-600 ring-1 ring-slate-200 dark:bg-dark-card dark:text-slate-300 dark:ring-dark-border">
                    <Icon size={16} strokeWidth={1.75} aria-hidden="true" />
                  </span>
                  <span className="max-w-full break-keep text-center text-[11px] leading-tight text-slate-500 sm:text-xs dark:text-slate-400">
                    {n.label}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
      <p className="sr-only">
        {goingDown ? '응답이 돌아오는 중' : '요청이 가는 중'}: {step.messages[active].label}
      </p>
    </div>
  );
}
