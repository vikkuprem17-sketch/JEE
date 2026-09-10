import { useState, useEffect, useRef } from 'react';
import { useStore } from '@/store';
import { Mascot } from '@/components/Mascot';
import { Confetti } from '@/components/Confetti';
import { ProgressRing } from '@/components/ProgressRing';
import { formatDuration } from '@/lib/scheduleParser';
import type { Task } from '@/types';
import { X, Play, Pause, Check, Zap } from 'lucide-react';

interface FocusModeProps {
  task: Task;
  onExit: () => void;
  onComplete: (duration: number, pyqCorrect?: number, pyqWrong?: number) => void;
}

export function FocusMode({ task, onExit, onComplete }: FocusModeProps) {
  const { state } = useStore();
  const totalSeconds = task.duration * 60;
  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [pyqCorrect, setPyqCorrect] = useState(0);
  const [pyqWrong, setPyqWrong] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const remaining = Math.max(0, totalSeconds - elapsed);
  const progress = (elapsed / totalSeconds) * 100;

  useEffect(() => {
    if (isRunning && !isComplete) {
      intervalRef.current = setInterval(() => {
        setElapsed((prev) => {
          if (prev + 1 >= totalSeconds) {
            setIsRunning(false);
            setIsComplete(true);
            setShowConfetti(true);
            return totalSeconds;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, isComplete, totalSeconds]);

  function handleComplete() {
    setShowConfetti(true);
    setIsComplete(true);
    setIsRunning(false);
  }

  function handleConfirm() {
    const durationMinutes = Math.round(elapsed / 60);
    onComplete(durationMinutes, task.pyqCount ? pyqCorrect : undefined, task.pyqCount ? pyqWrong : undefined);
  }

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const subjectCap = task.subject.charAt(0).toUpperCase() + task.subject.slice(1);

  return (
    <div className="fixed inset-0 z-50 bg-void-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 animate-fade-in">
      <Confetti trigger={showConfetti} onComplete={() => setShowConfetti(false)} />

      {/* Exit button */}
      {!isComplete && (
        <button
          onClick={onExit}
          className="absolute top-6 right-6 text-slate-500 hover:text-slate-300 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      )}

      {/* LOCK IN header */}
      <div className="text-center mb-8">
        <p className="text-xs font-mono uppercase tracking-[0.3em] text-nebula-500 mb-2">
          {isComplete ? 'MISSION COMPLETE' : 'LOCK IN MODE'}
        </p>
        <h1 className="font-display font-black text-3xl md:text-4xl gradient-text">
          {isComplete ? 'FIRE' : subjectCap}
        </h1>
        {!isComplete && (
          <p className="text-slate-400 mt-2 text-lg">{task.title.replace(/^.*—\s*/, '')}</p>
        )}
      </div>

      {/* Timer Ring */}
      <div className="relative mb-8">
        <ProgressRing progress={progress} size={280} strokeWidth={12} color={isComplete ? '#34d399' : '#8b5cf6'}>
          {isComplete ? (
            <div className="text-center">
              <Mascot level={state.stats.level} size={80} expression="fire" className="mx-auto mb-2" />
              <p className="font-display font-black text-3xl gradient-text-emerald">+{task.xpReward} XP</p>
            </div>
          ) : (
            <div className="text-center">
              <p className="font-display font-black text-5xl font-mono text-white tabular-nums">
                {mins.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')}
              </p>
              <p className="text-sm text-slate-500 mt-1 font-mono">REMAINING</p>
            </div>
          )}
        </ProgressRing>
      </div>

      {/* Progress bar */}
      {!isComplete && (
        <div className="w-full max-w-md mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-slate-500">PROGRESS</span>
            <span className="text-xs font-mono text-nebula-400">{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 bg-void-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #8b5cf6, #22d3ee)' }}
            />
          </div>
        </div>
      )}

      {/* Controls */}
      {!isComplete ? (
        <div className="flex gap-4">
          {!isRunning ? (
            <button
              onClick={() => setIsRunning(true)}
              className="btn-primary text-lg px-10 py-4 inline-flex items-center gap-2"
            >
              <Play className="w-6 h-6" fill="white" /> Start
            </button>
          ) : (
            <button
              onClick={() => setIsRunning(false)}
              className="btn-ghost text-lg px-10 py-4 inline-flex items-center gap-2"
            >
              <Pause className="w-6 h-6" /> Pause
            </button>
          )}
          <button
            onClick={handleComplete}
            className="btn-ghost text-lg px-10 py-4 inline-flex items-center gap-2 text-emerald-400 border-emerald-500/30"
          >
            <Check className="w-6 h-6" /> Done
          </button>
        </div>
      ) : (
        <div className="w-full max-w-md space-y-4 animate-scale-in">
          {task.pyqCount && (
            <div className="glass-card p-4">
              <p className="text-sm font-mono uppercase text-slate-500 mb-3">How did you do?</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-emerald-400 font-medium">Correct</label>
                  <input
                    type="number"
                    min="0"
                    max={task.pyqCount}
                    value={pyqCorrect}
                    onChange={(e) => setPyqCorrect(Math.min(parseInt(e.target.value) || 0, task.pyqCount!))}
                    className="input-field mt-1 text-center text-lg font-bold text-emerald-400"
                  />
                </div>
                <div>
                  <label className="text-xs text-rose-400 font-medium">Wrong</label>
                  <input
                    type="number"
                    min="0"
                    max={task.pyqCount}
                    value={pyqWrong}
                    onChange={(e) => setPyqWrong(Math.min(parseInt(e.target.value) || 0, task.pyqCount!))}
                    className="input-field mt-1 text-center text-lg font-bold text-rose-400"
                  />
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2 text-center">
                {pyqCorrect + pyqWrong} / {task.pyqCount} attempted · {pyqCorrect > 0 ? Math.round((pyqCorrect / (pyqCorrect + pyqWrong || 1)) * 100) : 0}% accuracy
              </p>
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={onExit} className="btn-ghost flex-1">
              Back
            </button>
            <button onClick={handleConfirm} className="btn-primary flex-1 inline-flex items-center justify-center gap-2">
              <Zap className="w-5 h-5" fill="white" /> Claim XP
            </button>
          </div>
        </div>
      )}

      {/* Mascot encouragement */}
      {!isComplete && isRunning && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center">
          <Mascot level={state.stats.level} size={48} expression="neutral" className="mx-auto opacity-60" />
          <p className="text-xs text-slate-600 mt-1">Stay locked in.</p>
        </div>
      )}
    </div>
  );
}
