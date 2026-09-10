import { useState } from 'react';
import { useStore } from '@/store';
import { ProgressRing } from '@/components/ProgressRing';
import type { SubjectId, Chapter } from '@/types';
import { Atom, FlaskConical, Sigma, ChevronDown, TrendingUp, Target, Brain, Gauge } from 'lucide-react';

const SUBJECT_CONFIG: Record<SubjectId, { name: string; icon: typeof Atom; color: string; bg: string; border: string }> = {
  physics: { name: 'Physics', icon: Atom, color: 'text-electric-400', bg: 'bg-electric-400/10', border: 'border-electric-400/30' },
  chemistry: { name: 'Chemistry', icon: FlaskConical, color: 'text-nebula-400', bg: 'bg-nebula-400/10', border: 'border-nebula-400/30' },
  mathematics: { name: 'Mathematics', icon: Sigma, color: 'text-plasma-500', bg: 'bg-plasma-500/10', border: 'border-plasma-500/30' },
};

const REVISION_LABELS: Record<string, { label: string; color: string }> = {
  fresh: { label: 'Fresh', color: 'text-emerald-400' },
  due_soon: { label: 'Due Soon', color: 'text-amber-400' },
  due: { label: 'Due', color: 'text-plasma-500' },
  overdue: { label: 'Overdue', color: 'text-rose-400' },
};

export function Subjects() {
  const { state } = useStore();
  const [activeSubject, setActiveSubject] = useState<SubjectId>('physics');
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null);

  const subjects: SubjectId[] = ['physics', 'chemistry', 'mathematics'];
  const chapters = state.chapters.filter((c) => c.subject === activeSubject);

  // Subject-level stats
  const subjectStats = subjects.map((subj) => {
    const subjChapters = state.chapters.filter((c) => c.subject === subj);
    const avgMastery = Math.round(subjChapters.reduce((s, c) => s + c.conceptMastery, 0) / subjChapters.length);
    const avgAccuracy = Math.round(subjChapters.reduce((s, c) => s + c.accuracy, 0) / subjChapters.length);
    const weakCount = subjChapters.filter((c) => c.isWeak).length;
    const totalPyqs = subjChapters.reduce((s, c) => s + c.totalPyqs, 0);
    const correctPyqs = subjChapters.reduce((s, c) => s + c.correctPyqs, 0);
    return { subject: subj, avgMastery, avgAccuracy, weakCount, totalPyqs, correctPyqs, chapterCount: subjChapters.length };
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display font-bold text-3xl mb-1">JEE Subjects</h1>
        <p className="text-slate-400">Chapter mastery, PYQs, revision, and performance tracking</p>
      </div>

      {/* Subject overview cards */}
      <div className="grid md:grid-cols-3 gap-4">
        {subjectStats.map((stat) => {
          const config = SUBJECT_CONFIG[stat.subject];
          const Icon = config.icon;
          return (
            <button
              key={stat.subject}
              onClick={() => setActiveSubject(stat.subject)}
              className={`glass-card p-5 text-left transition-all ${
                activeSubject === stat.subject ? `border ${config.border} ${config.bg}` : 'hover:border-nebula-500/20'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${config.color}`} />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg">{config.name}</h3>
                  <p className="text-xs text-slate-500">{stat.chapterCount} chapters</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <ProgressRing progress={stat.avgMastery} size={56} strokeWidth={5} color={stat.subject === 'physics' ? '#22d3ee' : stat.subject === 'chemistry' ? '#8b5cf6' : '#f97316'}>
                  <span className="text-xs font-bold text-slate-300">{stat.avgMastery}%</span>
                </ProgressRing>
                <div className="text-sm space-y-0.5">
                  <p className="text-slate-400">Accuracy: <span className="text-white font-medium">{stat.avgAccuracy}%</span></p>
                  <p className="text-slate-400">PYQs: <span className="text-white font-medium">{stat.correctPyqs}/{stat.totalPyqs}</span></p>
                  <p className="text-slate-400">Weak: <span className="text-rose-400 font-medium">{stat.weakCount}</span></p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Chapter list for active subject */}
      <div>
        <h2 className="font-display font-bold text-xl mb-3 flex items-center gap-2">
          {SUBJECT_CONFIG[activeSubject].name} Chapters
        </h2>
        <div className="space-y-2">
          {chapters.map((chapter) => (
            <ChapterCard
              key={chapter.id}
              chapter={chapter}
              expanded={expandedChapter === chapter.id}
              onToggle={() => setExpandedChapter(expandedChapter === chapter.id ? null : chapter.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ChapterCard({ chapter, expanded, onToggle }: { chapter: Chapter; expanded: boolean; onToggle: () => void }) {
  const overall = Math.round((chapter.conceptMastery + chapter.pyqMastery + chapter.accuracy + chapter.speed) / 4);
  const revStatus = REVISION_LABELS[chapter.revisionStatus];

  return (
    <div className={`glass-card overflow-hidden transition-all ${chapter.isWeak ? 'border-rose-500/15' : ''}`}>
      <button onClick={onToggle} className="w-full p-4 flex items-center gap-4 text-left">
        <ProgressRing progress={overall} size={48} strokeWidth={4} color={overall >= 75 ? '#34d399' : overall >= 50 ? '#fbbf24' : '#f43f5e'}>
          <span className="text-[10px] font-bold text-slate-300">{overall}%</span>
        </ProgressRing>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-display font-semibold truncate">{chapter.name}</h3>
            {chapter.isWeak && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-rose-500/15 text-rose-400 border border-rose-500/20">WEAK</span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className={`text-xs ${revStatus.color}`}>{revStatus.label}</span>
            <span className="text-xs text-slate-500">·</span>
            <span className="text-xs text-slate-500">{chapter.correctPyqs}/{chapter.totalPyqs} PYQs</span>
            <span className="text-xs text-slate-500">·</span>
            <span className="text-xs text-slate-500">{chapter.mistakes} mistakes</span>
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-slate-500 transition-transform flex-shrink-0 ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {expanded && (
        <div className="px-4 pb-4 animate-fade-in">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <MasteryStat icon={Brain} label="Concept" value={chapter.conceptMastery} color="text-nebula-400" />
            <MasteryStat icon={Target} label="PYQ" value={chapter.pyqMastery} color="text-electric-400" />
            <MasteryStat icon={TrendingUp} label="Accuracy" value={chapter.accuracy} color="text-emerald-400" />
            <MasteryStat icon={Gauge} label="Speed" value={chapter.speed} color="text-plasma-500" />
          </div>
          <div className="p-3 rounded-lg bg-void-800/50 border border-nebula-500/10">
            <p className="text-xs font-mono uppercase text-slate-500 mb-1">Recommended Next Action</p>
            <p className="text-sm text-slate-300">
              {chapter.conceptMastery < 60
                ? `Focus on concepts first — study the theory of ${chapter.name} for 45 min, then attempt 15 medium PYQs.`
                : chapter.pyqMastery < 70
                ? `Your concepts are solid. Grind 25 PYQs from ${chapter.name} to boost your PYQ mastery.`
                : chapter.accuracy < 75
                ? `Speed and accuracy drill: 20 timed PYQs from ${chapter.name}. Target 85%+ accuracy.`
                : `You're strong here. Schedule a revision in 7 days to maintain mastery.`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function MasteryStat({ icon: Icon, label, value, color }: { icon: typeof Brain; label: string; value: number; color: string }) {
  return (
    <div className="p-3 rounded-lg bg-void-800/50 border border-void-700">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className={`w-3.5 h-3.5 ${color}`} />
        <span className="text-xs font-mono uppercase text-slate-500">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-void-700 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${value}%`, background: value >= 75 ? '#34d399' : value >= 50 ? '#fbbf24' : '#f43f5e' }}
          />
        </div>
        <span className={`text-xs font-bold ${color}`}>{value}%</span>
      </div>
    </div>
  );
}
