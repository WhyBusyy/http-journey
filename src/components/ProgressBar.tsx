import { useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { $elapsedMs } from '../stores/progress';

export default function ProgressBar({ total }: { total: number }) {
  const elapsed = useStore($elapsedMs);

  // Step이 아닌 구간(Hero, 워터폴, footer)에 중앙선이 오면 다이어그램은 아무도 값을 쓰지 않는다.
  // 순간 이동해도 값이 멈춰 있지 않게, Step 위쪽이면 0, Step 아래쪽이면 총합으로 맞춘다.
  useEffect(() => {
    const onScroll = () => {
      const sections = document.querySelectorAll('section[data-step]');
      if (!sections.length) return;
      const center = window.innerHeight / 2;
      if (sections[0].getBoundingClientRect().top > center) $elapsedMs.set(0);
      else if (sections[sections.length - 1].getBoundingClientRect().bottom < center) $elapsedMs.set(total);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [total]);
  const pct = total ? (elapsed / total) * 100 : 0;

  return (
    <div
      data-elapsed={elapsed}
      className="fixed inset-x-0 top-0 z-30 bg-white/85 backdrop-blur dark:bg-dark-bg/85"
    >
      <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-2">
        <span className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">경과</span>
        <span className="tabular-nums">
          <span data-elapsed-value className="text-xl font-bold text-accent">{Math.round(elapsed)}ms</span>
          <span className="ml-1 text-sm text-slate-400">/ ~{total}ms</span>
        </span>
      </div>
      <div className="h-[3px] bg-slate-100 dark:bg-white/5">
        <div className="h-full bg-blue-600 dark:bg-blue-400" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
