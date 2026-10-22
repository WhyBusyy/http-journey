import { useRef, useState } from 'react';
import { useMotionValueEvent, useReducedMotion, useScroll } from 'motion/react';
import {
  Building2, Cloud, Cpu, Database, Hand, HardDrive, MemoryStick,
  Monitor, Network, RadioTower, Router, Server, Smartphone, type LucideIcon,
} from 'lucide-react';
import type { PhysicalNode, Step } from '../data/types';
import { activeMessageIndex, arrowPosition, elapsedAt, isRoundTrip, rowProgress, type TimelineEntry } from '../lib/timeline';
import { $elapsedMs } from '../stores/progress';

// steps.ts에서 쓰는 아이콘만 가져온다(전체 import는 번들을 키운다)
const ICONS: Record<string, LucideIcon> = {
  Building2, Cloud, Cpu, Database, Hand, HardDrive, MemoryStick,
  Monitor, Network, RadioTower, Router, Server, Smartphone,
};

const DOT =
  'absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600 shadow-[0_0_0_4px_rgba(37,99,235,0.15)] dark:bg-blue-400';

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

  const directions = step.messages.map((m) => m.direction);
  const sequence = isRoundTrip(directions);
  const active = activeMessageIndex(progress, step.messages.length);
  const { row, t } = rowProgress(progress, step.messages.length);
  const n = step.nodes.length;
  // 화살표/줄 위 공간 위치(응답은 오→왼)
  const position = sequence ? arrowPosition(t, directions[row], n, reduced) : arrowPosition(progress, directions[0], n, reduced);
  // 시간 순 누적 위치(아래로 스크롤하면 항상 커진다)
  const raw = (sequence ? row + t : progress * step.messages.length) * (n - 1);
  const packet = reduced ? Math.round(raw) : raw;
  const goingDown = step.messages[active].direction === 'down';
  const center = (i: number) => `${((i + 0.5) / n) * 100}%`;
  const dotMotion = reduced ? '' : 'transition-[left] duration-150 ease-out';

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
          <Nodes nodes={step.nodes} />

          {sequence ? (
            // 시퀀스 다이어그램: 장비마다 세로선(lifeline), 메시지는 시간 순으로 위→아래 가로 화살표
            <div data-lane="sequence" className="relative mt-2">
              {step.nodes.map((node, i) => (
                <span
                  key={node.id}
                  aria-hidden="true"
                  className="absolute bottom-0 top-0 w-px -translate-x-1/2 border-l border-dashed border-slate-300 dark:border-slate-700"
                  style={{ left: center(i) }}
                />
              ))}
              {step.messages.map((m, li) => {
                const state = li < row ? 'done' : li === row ? 'active' : 'pending';
                const down = m.direction === 'down';
                return (
                  <div
                    key={m.label}
                    data-arrow={li}
                    data-state={state}
                    className={`relative h-11 transition-opacity ${state === 'active' ? '' : state === 'done' ? 'opacity-50' : 'opacity-30'}`}
                  >
                    <span
                      className={`absolute top-1 -translate-x-1/2 whitespace-nowrap bg-slate-50/90 px-1 font-mono text-[11px] dark:bg-dark-card ${
                        state === 'active' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500'
                      }`}
                      style={{ left: '50%' }}
                    >
                      {m.label}
                    </span>
                    <div
                      className={`absolute top-7 h-0.5 ${state === 'active' ? 'bg-blue-600 dark:bg-blue-400' : 'bg-slate-400'}`}
                      style={{ left: center(0), right: `${(0.5 / n) * 100}%` }}
                    >
                      {/* 화살촉: 받는 쪽 끝 */}
                      <span
                        aria-hidden="true"
                        className={`absolute top-1/2 h-0 w-0 -translate-y-1/2 border-y-[5px] border-y-transparent ${
                          down
                            ? `-left-0.5 border-r-[7px] ${state === 'active' ? 'border-r-blue-600 dark:border-r-blue-400' : 'border-r-slate-400'}`
                            : `-right-0.5 border-l-[7px] ${state === 'active' ? 'border-l-blue-600 dark:border-l-blue-400' : 'border-l-slate-400'}`
                        }`}
                      />
                      {state === 'active' && (
                        <span aria-hidden="true" className={`${DOT} top-1/2 ${dotMotion}`} style={{ left: `${(position / (n - 1)) * 100}%` }} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // 한 방향 단계: 줄 하나. 점은 메시지 방향대로(응답이면 오→왼) 움직인다
            <div data-lane="rows" className="absolute inset-x-0 top-3 sm:top-[1.0625rem]">
              <div className="absolute h-0.5 bg-slate-200 dark:bg-dark-border" style={{ left: center(0), right: `${(0.5 / n) * 100}%` }}>
                <span aria-hidden="true" className={`${DOT} top-1/2 ${dotMotion}`} style={{ left: `${(position / (n - 1)) * 100}%` }} />
              </div>
            </div>
          )}
        </div>
      </div>
      <p className="sr-only">
        {goingDown ? '응답이 돌아오는 중' : '요청이 가는 중'}: {step.messages[active].label}
      </p>
    </div>
  );
}

function Nodes({ nodes }: { nodes: PhysicalNode[] }) {
  return (
    <ol className="relative z-10 grid" style={{ gridTemplateColumns: `repeat(${nodes.length}, minmax(0, 1fr))` }}>
      {nodes.map((node) => {
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
  );
}
