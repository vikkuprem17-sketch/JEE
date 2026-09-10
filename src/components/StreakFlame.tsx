interface StreakFlameProps {
  streak: number;
  size?: 'sm' | 'md' | 'lg';
}

export function StreakFlame({ streak, size = 'md' }: StreakFlameProps) {
  const sizes = {
    sm: { icon: 'w-4 h-4', text: 'text-sm', container: 'gap-1' },
    md: { icon: 'w-5 h-5', text: 'text-base', container: 'gap-1.5' },
    lg: { icon: 'w-8 h-8', text: 'text-2xl', container: 'gap-2' },
  };
  const s = sizes[size];

  const flameColor = streak >= 30 ? '#f43f5e' : streak >= 14 ? '#f97316' : streak >= 7 ? '#fbbf24' : '#94a3b8';

  return (
    <div className={`inline-flex items-center ${s.container}`}>
      <svg className={`${s.icon} animate-flame`} viewBox="0 0 24 24" fill="none">
        <path
          d="M12 2C12 2 8 6 8 10C8 12 9 13 10 13C10 11 11 10 12 10C12 12 14 13 14 15C14 17 13 18 12 18C15 18 18 15 18 11C18 7 12 2 12 2Z"
          fill={flameColor}
          stroke={flameColor}
          strokeWidth="1"
        />
        <path
          d="M12 10C12 10 10 12 10 14C10 15.5 11 16 12 16C13 16 14 15 14 13.5C14 12 12 10 12 10Z"
          fill="#fbbf24"
          opacity="0.8"
        />
      </svg>
      <span className={`font-display font-bold ${s.text}`} style={{ color: flameColor }}>
        {streak}
      </span>
    </div>
  );
}
