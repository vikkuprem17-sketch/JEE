import { useState, useEffect } from 'react';
import { useStore } from '@/store';
import { Mascot } from '@/components/Mascot';
import { XPBar } from '@/components/XPBar';
import { StreakFlame } from '@/components/StreakFlame';
import { ProgressRing } from '@/components/ProgressRing';
import { FocusMode } from '@/views/FocusMode';
import { formatTime, formatDuration } from '@/lib/scheduleParser';
import { getDateStr, getStudyWindowsForDate, getBlocksForDate } from '@/lib/scheduleEngine';
import type { Task } from '@/types';
import { Flame, Clock, Target, Zap, ChevronRight, Play, CheckCircle2, Circle, AlertCircle, TrendingUp, BookOpen, Brain } from 'lucide-react';

const MISSION_ICONS = {
  main: { icon: Flame, color: 'text-plasma-500', bg: 'bg-plasma-500/10', border: 'border-plasma-500/30', label: 'MAIN QUEST' },
  side: { icon: Zap, color: 'text-electric-400', bg: 'bg-electric-400/10', border: 'border-electric-400/30', label: 'SIDE QUEST' },
  memory: { icon: Brain, color: 'text-nebula-400', bg: 'bg-nebula-400/10', border: 'border-nebula-400/30', label: 'MEMORY QUEST' },
  boss: { icon: Target, color: 'text-rose-400', bg: 'bg-rose-400/10', border: 'border-rose-400/30', label: 'BOSS QUEST' },
};

export function Dashboard() {
  const { state, completeTask, addXp, regenerateTasks } = useStore();
  const [focusTask, setFocusTask] = useState<Task | null>(null);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Auto-generate tasks if none for today
  useEffect(() => {
    const dateStr = getDateStr(now);
    const hasTodayTasks = state.tasks.some((t) => t.date === dateStr);
    if (!hasTodayTasks && state.profile.onboarded && state.baseSchedule.length > 0) {
      regenerateTasks();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.profile.onboarded, state.baseSchedule.length]);

  const dateStr = getDateStr(now);
  const todayTasks = state.tasks.filter((t) => t.date === dateStr);
  const completedTasks = todayTasks.filter((t) => t.status === 'completed');
  const pendingTasks = todayTasks.filter((t) => t.status === 'pending');
  const completedMinutes = completedTasks.reduce((s, t) => s + (t.actualDuration || t.duration), 0);
  const plannedMinutes = todayTasks.reduce((s, t) => s + t.duration, 0);
  const totalPyqs = completedTasks.reduce((s, t) => s + (t.pyqCount || 0), 0);
  const correctPyqs = completedTasks.reduce((s, t) => s + (t.pyqCorrect || 0), 0);
  const accuracy = totalPyqs > 0 ? Math.round((correctPyqs / totalPyqs) * 100) : 0;

  const dayBlocks = getBlocksForDate(state.baseSchedule, state.exceptions, now);
  const studyWindows = getStudyWindowsForDate(state.baseSchedule, state.exceptions, now);

  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : hour < 21 ? 'Good evening' : 'Good night';
  const name = state.profile.name || 'aspirant';

  const nextTask = pendingTasks[0];
  const completionRate = plannedMinutes > 0 ? Math.round((completedMinutes / plannedMinutes) * 100) : 0;

  const dueRevisions = state.revisions.filter((r) => !r.completed && r.scheduledDate <= dateStr);
  const overdueErrors = state.errors.filter((e) => !e.resolved);

  if (focusTask) {
    return <FocusMode task={focusTask} onExit={() => setFocusTask(null)} onComplete={(duration, pyqCorrect, pyqWrong) => {
      completeTask(focusTask.id, duration, pyqCorrect, pyqWrong);
      addXp(focusTask.xpReward);
      setFocusTask(null);
    }} />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Greeting + Stats Header */}
      <div className="glass-card p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-nebula-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex items-center gap-4">
            <Mascot level={state.stats.level} size={72} expression={completionRate >= 50 ? 'happy' : 'neutral'} />
            <div>
              <h1 className="font-display font-bold text-2xl md:text-3xl">
                {greeting}, <span className="gradient-text">{name}</span>
              </h1>
              <div className="flex items-center gap-4 mt-1">
                <StreakFlame streak={state.stats.streak} size="sm" />
                <span className="text-sm text-slate-400">·</span>
                <span className="text-sm font-mono text-nebula-400">{state.stats.mascotStage}</span>
              </div>
            </div>
          </div>

          <div className="flex-1 md:max-w-sm md:ml-auto">
            <XPBar xp={state.stats.xp} xpToNext={state.stats.xpToNext} level={state.stats.level} />
          </div>
        </div>
      </div>

      {/* Today's Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Clock} label="Planned" value={formatDuration(plannedMinutes)} color="text-electric-400" bg="bg-electric-400/10" />
        <StatCard icon={CheckCircle2} label="Completed" value={formatDuration(completedMinutes)} color="text-emerald-400" bg="bg-emerald-400/10" />
        <StatCard icon={Target} label="PYQs" value={`${correctPyqs}/${totalPyqs}`} color="text-plasma-500" bg="bg-plasma-500/10" />
        <StatCard icon={TrendingUp} label="Accuracy" value={`${accuracy}%`} color="text-nebula-400" bg="bg-nebula-400/10" />
      </div>

      {/* Current Mission — Hero CTA */}
      {nextTask ? (
        <div className="glass-card p-6 relative overflow-hidden border-nebula-500/20">
          <div className="absolute -top-20 -right-20 w-48 h-48 bg-nebula-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-500">Current Mission</span>
              <div className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${MISSION_ICONS[nextTask.missionType].bg} ${MISSION_ICONS[nextTask.missionType].color} border ${MISSION_ICONS[nextTask.missionType].border}`}>
                {MISSION_ICONS[nextTask.missionType].label}
              </div>
            </div>
            <h2 className="font-display font-bold text-2xl mb-1">
              <span className="capitalize">{nextTask.subject}</span> — {nextTask.title.replace(/^.*—\s*/, '')}
            </h2>
            <p className="text-slate-400 text-sm mb-4">{formatDuration(nextTask.duration)} · {nextTask.chapter}</p>
            <button
              onClick={() => setFocusTask(nextTask)}
              className="btn-primary text-lg px-8 py-4 inline-flex items-center gap-2 w-full sm:w-auto justify-center"
            >
              <Play className="w-5 h-5" fill="white" /> Start Mission
            </button>
          </div>
        </div>
      ) : (
        <div className="glass-card p-6 text-center">
          <Mascot level={state.stats.level} size={64} expression="excited" className="mx-auto" />
          <h2 className="font-display font-bold text-xl mt-3 mb-1">All missions complete!</h2>
          <p className="text-slate-400 text-sm">You crushed it today. Want more? Ask your AI mentor.</p>
        </div>
      )}

      {/* Today's Ascension — Mission List */}
      <div>
        <h3 className="font-display font-bold text-lg mb-3 flex items-center gap-2">
          <Flame className="w-5 h-5 text-plasma-500" />
          Today's Ascension
        </h3>
        <div className="space-y-2">
          {todayTasks.map((task) => {
            const config = MISSION_ICONS[task.missionType];
            const Icon = config.icon;
            const isCompleted = task.status === 'completed';
            return (
              <div
                key={task.id}
                className={`glass-card p-4 flex items-center gap-4 transition-all ${isCompleted ? 'opacity-50' : 'hover:border-nebula-500/30'}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${config.bg} ${config.border} border flex-shrink-0`}>
                  <Icon className={`w-5 h-5 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium truncate ${isCompleted ? 'line-through text-slate-500' : ''}`}>
                    <span className="capitalize">{task.subject}</span> — {task.title.replace(/^.*—\s*/, '')}
                  </p>
                  <p className="text-xs text-slate-500">{formatDuration(task.duration)} · {task.chapter}</p>
                </div>
                {isCompleted ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                ) : (
                  <button
                    onClick={() => setFocusTask(task)}
                    className="text-nebula-400 hover:text-nebula-300 text-sm font-medium flex-shrink-0 flex items-center gap-1"
                  >
                    Start <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
          {todayTasks.length === 0 && (
            <div className="glass-card p-6 text-center text-slate-500">
              <Circle className="w-8 h-8 mx-auto mb-2 opacity-40" />
              No missions yet. Click "Regenerate" to build today's plan.
            </div>
          )}
        </div>
      </div>

      {/* Schedule + Side Info */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Today's Timeline */}
        <div className="glass-card p-5">
          <h3 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-electric-400" />
            Today's Timeline
          </h3>
          <div className="space-y-1.5 max-h-72 overflow-y-auto scrollbar-thin">
            {dayBlocks.map((block, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <span className="font-mono text-xs text-slate-500 w-28 flex-shrink-0">
                  {formatTime(block.start)} — {formatTime(block.end)}
                </span>
                <div className={`flex-1 h-7 rounded-md px-2 flex items-center text-xs font-medium ${
                  block.type === 'study' ? 'bg-emerald-500/15 text-emerald-400' :
                  block.type === 'school' ? 'bg-electric-400/15 text-electric-300' :
                  block.type === 'coaching' ? 'bg-nebula-500/15 text-nebula-400' :
                  block.type === 'sleep' ? 'bg-void-700 text-slate-500' :
                  'bg-void-800 text-slate-400'
                }`}>
                  {block.label}
                </div>
              </div>
            ))}
            {studyWindows.length > 0 && (
              <>
                <div className="h-px bg-nebula-500/10 my-2" />
                <p className="text-xs font-mono uppercase text-emerald-500 mb-1">Study Windows</p>
                {studyWindows.map((w, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <span className="font-mono text-xs text-emerald-400 w-28 flex-shrink-0">
                      {formatTime(w.start)} — {formatTime(w.end)}
                    </span>
                    <div className="flex-1 h-7 rounded-md px-2 flex items-center text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Free ({formatDuration(w.end - w.start)})
                    </div>
                  </div>
                ))}
              </>
            )}
            {dayBlocks.length === 0 && (
              <p className="text-sm text-slate-500 text-center py-4">No schedule set. Tell your AI mentor about your day.</p>
            )}
          </div>
        </div>

        {/* Side info: consistency, deadlines, backlog */}
        <div className="space-y-4">
          {/* Consistency Score */}
          <div className="glass-card p-5 flex items-center gap-4">
            <ProgressRing
              progress={state.stats.consistencyScore}
              size={80}
              strokeWidth={6}
              color="#34d399"
            >
              <span className="font-display font-black text-xl text-emerald-400">{state.stats.consistencyScore}</span>
            </ProgressRing>
            <div>
              <p className="text-xs font-mono uppercase text-slate-500">Consistency Score</p>
              <p className="font-display font-bold text-lg text-emerald-400">{state.stats.consistencyTier}</p>
              <p className="text-xs text-slate-500">Based on planned vs completed</p>
            </div>
          </div>

          {/* Revision Due */}
          <div className="glass-card p-5">
            <h4 className="font-display font-semibold text-sm mb-2 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              Revision Due
            </h4>
            {dueRevisions.length > 0 ? (
              <div className="space-y-1.5">
                {dueRevisions.slice(0, 3).map((r) => (
                  <div key={r.id} className="flex items-center justify-between text-sm">
                    <span className="text-slate-300">{r.chapter}</span>
                    <span className="text-xs text-amber-400 font-mono">{r.subject}</span>
                  </div>
                ))}
                {dueRevisions.length > 3 && <p className="text-xs text-slate-500">+{dueRevisions.length - 3} more</p>}
              </div>
            ) : (
              <p className="text-sm text-slate-500">All caught up!</p>
            )}
          </div>

          {/* Error Log Health */}
          <div className="glass-card p-5">
            <h4 className="font-display font-semibold text-sm mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400" />
              Error Log
            </h4>
            <p className="text-sm text-slate-300">
              <span className="text-rose-400 font-bold">{overdueErrors.length}</span> unresolved mistakes
            </p>
            {overdueErrors.length > 0 && (
              <p className="text-xs text-slate-500 mt-1">
                Most common: {getMostCommonError(overdueErrors)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <button onClick={regenerateTasks} className="btn-ghost inline-flex items-center gap-2 text-sm">
          <Zap className="w-4 h-4" /> Regenerate Plan
        </button>
      </div>
    </div>
  );
}

function getMostCommonError(errors: { type: string }[]): string {
  const counts: Record<string, number> = {};
  for (const e of errors) counts[e.type] = (counts[e.type] || 0) + 1;
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) return 'None';
  const labels: Record<string, string> = {
    concept: 'Concept mistakes',
    calculation: 'Calculation errors',
    silly: 'Silly mistakes',
    formula: 'Formula errors',
    misread: 'Misread questions',
    time_pressure: 'Time pressure',
    wrong_approach: 'Wrong approach',
    guess: 'Guesses',
  };
  return labels[sorted[0][0]] || sorted[0][0];
}

function StatCard({ icon: Icon, label, value, color, bg }: { icon: typeof Clock; label: string; value: string; color: string; bg: string }) {
  return (
    <div className="glass-card p-4">
      <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center mb-2`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <p className="text-xs font-mono uppercase text-slate-500">{label}</p>
      <p className={`font-display font-bold text-xl ${color}`}>{value}</p>
    </div>
  );
}
