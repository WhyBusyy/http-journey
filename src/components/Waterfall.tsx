import type { Step } from '../data/types';
import type { TimelineEntry } from '../lib/timeline';

type Props = { steps: Step[]; entries: TimelineEntry[]; total: number };

export default function Waterfall({ steps, entries, total }: Props) {
  // 막대는 앵커 링크라 JS 없이도 이동한다. 부드러운 스크롤과 reduced-motion 대응은 global.css의 scroll-behavior가 맡는다.
  return (
    <div className="card-base p-5 sm:p-7">
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
        POST /api/orders · 총 <span className="tabular-nums text-accent">~{total}ms</span>
      </p>
      <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">한눈에 다시 보기</h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">막대를 누르면 그 단계로 돌아가요.</p>

      <ol className="mt-6 space-y-1">
        {steps.map((s) => {
          const e = entries[s.index];
          return (
            <li key={s.slug}>
              <a
                href={`#step-${s.index}`}
                data-bar={s.index}
                aria-label={`${s.title}로 이동`}
                className="group grid w-full grid-cols-[7rem_1fr_2.5rem] items-center gap-3 rounded-lg px-1 py-1.5 text-left text-[13px] hover:bg-white/70 sm:grid-cols-[9rem_1fr_3rem] dark:hover:bg-white/5"
              >
                <span className="truncate text-slate-600 dark:text-slate-300">
                  <span className="tabular-nums text-slate-400">{s.index}</span> {s.title}
                </span>
                <span className="relative h-2.5">
                  <span
                    className="absolute top-0 h-2.5 rounded bg-slate-300 transition-colors group-hover:bg-blue-600 group-focus-visible:bg-blue-600 dark:bg-slate-600 dark:group-hover:bg-blue-400"
                    style={{ left: `${(e.start / total) * 100}%`, width: `${Math.max((e.duration / total) * 100, 0.8)}%` }}
                  />
                </span>
                <span className="text-right tabular-nums text-accent">{e.duration}</span>
              </a>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
