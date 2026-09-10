interface MascotProps {
  level: number;
  size?: number;
  expression?: 'happy' | 'neutral' | 'concerned' | 'excited' | 'fire';
  className?: string;
}

const STAGES = [
  { min: 75, name: 'ASCENDED', color: '#fbbf24' },
  { min: 50, name: 'JEE Beast', color: '#f43f5e' },
  { min: 30, name: 'Elite', color: '#a78bfa' },
  { min: 20, name: 'Scholar', color: '#22d3ee' },
  { min: 10, name: 'Grinder', color: '#34d399' },
  { min: 0, name: 'Rookie', color: '#94a3b8' },
];

function getStage(level: number) {
  return STAGES.find((s) => level >= s.min) || STAGES[STAGES.length - 1];
}

export function Mascot({ level, size = 80, expression = 'happy', className = '' }: MascotProps) {
  const stage = getStage(level);

  const eyeY = expression === 'concerned' ? 38 : 35;
  const mouthPath = {
    happy: 'M 30 52 Q 50 65 70 52',
    neutral: 'M 35 55 Q 50 53 65 55',
    concerned: 'M 35 58 Q 50 50 65 58',
    excited: 'M 30 50 Q 50 68 70 50',
    fire: 'M 30 48 Q 50 70 70 48',
  };

  return (
    <div className={`relative inline-block ${className}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" width={size} height={size} className="animate-float-slow">
        <defs>
          <radialGradient id={`mascot-glow-${stage.name.replace(/\s/g, '')}`}>
            <stop offset="0%" stopColor={stage.color} stopOpacity="0.4" />
            <stop offset="100%" stopColor={stage.color} stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`mascot-body-${stage.name.replace(/\s/g, '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stage.color} stopOpacity="0.9" />
            <stop offset="100%" stopColor={stage.color} stopOpacity="0.6" />
          </linearGradient>
        </defs>

        {/* Glow */}
        <circle cx="50" cy="50" r="48" fill={`url(#mascot-glow-${stage.name.replace(/\s/g, '')})`} />

        {/* Body — a cute rounded character */}
        <ellipse cx="50" cy="52" rx="32" ry="34" fill={`url(#mascot-body-${stage.name.replace(/\s/g, '')})`} stroke={stage.color} strokeWidth="1.5" />

        {/* Helmet/visor for higher levels */}
        {level >= 10 && (
          <path d="M 20 38 Q 50 15 80 38 L 80 42 L 20 42 Z" fill={stage.color} fillOpacity="0.3" stroke={stage.color} strokeWidth="1" />
        )}

        {/* Eyes */}
        {expression === 'excited' || expression === 'fire' ? (
          <>
            <path d="M 35 35 L 42 30 L 42 40 Z" fill="#fff" />
            <path d="M 65 35 L 58 30 L 58 40 Z" fill="#fff" />
            <circle cx="38" cy="35" r="3" fill="#0a0c1b" />
            <circle cx="62" cy="35" r="3" fill="#0a0c1b" />
          </>
        ) : expression === 'concerned' ? (
          <>
            <path d="M 32 33 Q 38 30 44 33" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M 56 33 Q 62 30 68 33" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" />
            <circle cx="38" cy={eyeY} r="3" fill="#fff" />
            <circle cx="62" cy={eyeY} r="3" fill="#fff" />
          </>
        ) : (
          <>
            <circle cx="38" cy={eyeY} r="4" fill="#fff" />
            <circle cx="62" cy={eyeY} r="4" fill="#fff" />
            <circle cx="38" cy={eyeY} r="2" fill="#0a0c1b" />
            <circle cx="62" cy={eyeY} r="2" fill="#0a0c1b" />
          </>
        )}

        {/* Mouth */}
        <path d={mouthPath[expression]} stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" />

        {/* Cheek blush */}
        <circle cx="28" cy="48" r="4" fill={stage.color} fillOpacity="0.3" />
        <circle cx="72" cy="48" r="4" fill={stage.color} fillOpacity="0.3" />

        {/* Level indicator stars for higher levels */}
        {level >= 30 && (
          <>
            <text x="50" y="18" textAnchor="middle" fontSize="10" fill={stage.color}>★</text>
          </>
        )}

        {/* Crown for ascended */}
        {level >= 75 && (
          <path d="M 35 12 L 40 20 L 50 10 L 60 20 L 65 12 L 65 22 L 35 22 Z" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1" />
        )}
      </svg>

      {/* Floating particles for higher levels */}
      {level >= 20 && (
        <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-electric-400 animate-pulse-glow" />
      )}
      {level >= 50 && (
        <>
          <div className="absolute -top-2 left-0 w-1.5 h-1.5 rounded-full bg-plasma-500 animate-pulse-glow" style={{ animationDelay: '0.5s' }} />
          <div className="absolute bottom-0 -right-2 w-1.5 h-1.5 rounded-full bg-nebula-400 animate-pulse-glow" style={{ animationDelay: '1s' }} />
        </>
      )}
    </div>
  );
}
