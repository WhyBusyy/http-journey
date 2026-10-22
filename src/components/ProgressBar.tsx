import { useStore } from '@nanostores/react';
import { $elapsedMs } from '../stores/progress';

export default function ProgressBar({ total }: { total: number }) {
  const elapsed = useStore($elapsedMs);
  const pct = total ? (elapsed / total) * 100 : 0;

  return (
    <div
      data-elapsed={elapsed}
      className="fixed inset-x-0 top-0 z-30 bg-white/85 backdrop-blur dark:bg-dark-bg/85"
    >
      <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-2 text-xs">
        <span className="font-semibold uppercase tracking-[0.15em] text-slate-400">경과</span>
        <span className="font-semibold tabular-nums text-accent">
          {Math.round(elapsed)}ms <span className="font-normal text-slate-400">/ ~{total}ms</span>
        </span>
      </div>
      <div className="h-[3px] bg-slate-100 dark:bg-white/5">
        <div className="h-full bg-blue-600 dark:bg-blue-400" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
