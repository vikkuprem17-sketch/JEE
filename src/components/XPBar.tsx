import { useEffect, useState } from 'react';

interface XPBarProps {
  xp: number;
  xpToNext: number;
  level: number;
}

export function XPBar({ xp, xpToNext, level }: XPBarProps) {
  const [displayXp, setDisplayXp] = useState(xp);
  const progress = (displayXp / xpToNext) * 100;

  useEffect(() => {
    const duration = 800;
    const start = displayXp;
    const diff = xp - start;
    if (diff === 0) return;
    const startTime = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayXp(Math.round(start + diff * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [xp]);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-mono text-nebula-400">LVL {level}</span>
        <span className="text-xs font-mono text-slate-400">{displayXp.toLocaleString()} / {xpToNext.toLocaleString()} XP</span>
      </div>
      <div className="h-2.5 bg-void-800 rounded-full overflow-hidden relative">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out relative"
          style={{
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #8b5cf6, #22d3ee)',
            boxShadow: '0 0 10px rgba(139, 92, 246, 0.5)',
          }}
        >
          <div className="absolute inset-0 opacity-50" style={{
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 2s linear infinite',
          }} />
        </div>
      </div>
    </div>
  );
}
