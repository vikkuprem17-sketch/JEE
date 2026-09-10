import { useState } from 'react';
import { useStore } from '@/store';
import { parseSchedule, formatTime, formatDuration, type ParsedScheduleResult } from '@/lib/scheduleParser';
import { generateDailyTasks, getStudyWindowsForDate, getDateStr } from '@/lib/scheduleEngine';
import { Mascot } from '@/components/Mascot';
import { Zap, ArrowRight, ArrowLeft, Check, Sparkles, Clock, BookOpen, Target } from 'lucide-react';

type Step = 'welcome' | 'name' | 'target' | 'level' | 'weak' | 'capacity' | 'schedule' | 'review' | 'activating';

const SAMPLE_SCHEDULE = `school 8 to 3, reach home around 3:45, coaching mon wed fri 6-8, usually study after dinner till 12`;

export function Onboarding() {
  const { state, dispatch } = useStore();
  const [step, setStep] = useState<Step>('welcome');
  const [name, setName] = useState('');
  const [target, setTarget] = useState<'JEE Main' | 'JEE Advanced' | 'Both'>('Both');
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [weakChapters, setWeakChapters] = useState<string[]>([]);
  const [capacity, setCapacity] = useState(5);
  const [scheduleText, setScheduleText] = useState('');
  const [parsed, setParsed] = useState<ParsedScheduleResult | null>(null);
  const [showCorrection, setShowCorrection] = useState(false);
  const [correctionText, setCorrectionText] = useState('');

  const weakChapterOptions = state.chapters.filter((c) => c.isWeak).map((c) => `${c.subject} — ${c.name}`);

  function toggleWeak(ch: string) {
    setWeakChapters((prev) => (prev.includes(ch) ? prev.filter((x) => x !== ch) : [...prev, ch]));
  }

  function handleParseSchedule() {
    const result = parseSchedule(scheduleText);
    setParsed(result);
    setStep('review');
  }

  function handleCorrection() {
    const reParsed = parseSchedule(scheduleText + ' ' + correctionText);
    setParsed(reParsed);
    setCorrectionText('');
    setShowCorrection(false);
  }

  function handleComplete() {
    setStep('activating');
    setTimeout(() => {
      if (parsed) {
        dispatch({ type: 'SET_BASE_SCHEDULE', schedule: parsed.blocks });
      }
      dispatch({
        type: 'UPDATE_PROFILE',
        profile: { name, jeeTarget: target, preparationLevel: level, weakChapters, studyCapacity: capacity, onboarded: true },
      });

      // Generate first day's tasks
      const today = new Date();
      const dateStr = getDateStr(today);
      const windows = getStudyWindowsForDate(parsed?.blocks || [], [], today);
      const tasks = generateDailyTasks(state.chapters, windows, 'normal', dateStr, []);
      dispatch({ type: 'SET_TASKS', tasks });
    }, 2800);
  }

  const steps: Step[] = ['welcome', 'name', 'target', 'level', 'weak', 'capacity', 'schedule', 'review'];
  const currentIdx = steps.indexOf(step === 'activating' ? 'review' : step);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <div className="w-full max-w-2xl">
        {/* Progress dots */}
        {step !== 'welcome' && step !== 'activating' && (
          <div className="flex items-center justify-center gap-2 mb-8">
            {steps.map((s, i) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentIdx ? 'w-8 bg-nebula-500' : i < currentIdx ? 'w-4 bg-nebula-500/50' : 'w-4 bg-void-700'
                }`}
              />
            ))}
          </div>
        )}

        {step === 'welcome' && (
          <div className="text-center animate-fade-in-up">
            <div className="flex justify-center mb-6">
              <Mascot level={1} size={120} expression="excited" />
            </div>
            <h1 className="font-display font-black text-5xl md:text-6xl gradient-text mb-4 text-glow-purple">
              JEE ASCEND
            </h1>
            <p className="text-xl text-slate-300 mb-2 font-display">The Ultimate AI JEE Productivity OS</p>
            <p className="text-slate-400 mb-8 max-w-md mx-auto text-balance">
              Your preparation is about to become a system. Duolingo meets Notion meets an RPG progression system — built for JEE.
            </p>
            <button onClick={() => setStep('name')} className="btn-primary text-lg px-8 py-4 inline-flex items-center gap-2">
              Begin Ascension <ArrowRight className="w-5 h-5" />
            </button>
            <p className="text-xs text-slate-600 mt-6">No sign-up required. Your data stays on your device.</p>
          </div>
        )}

        {step === 'name' && (
          <div className="glass-card p-8 animate-scale-in">
            <div className="flex items-center gap-2 mb-2 text-nebula-400">
              <Sparkles className="w-5 h-5" />
              <span className="text-sm font-mono uppercase tracking-wider">Step 1</span>
            </div>
            <h2 className="font-display font-bold text-3xl mb-2">What should I call you?</h2>
            <p className="text-slate-400 mb-6">Don't worry, this stays on your device. No accounts, no tracking.</p>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && name.trim() && setStep('target')}
              placeholder="Your name or nickname"
              className="input-field text-lg"
              autoFocus
            />
            <div className="flex justify-between mt-6">
              <button onClick={() => setStep('welcome')} className="btn-ghost inline-flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={() => setStep('target')}
                disabled={!name.trim()}
                className="btn-primary inline-flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 'target' && (
          <div className="glass-card p-8 animate-scale-in">
            <div className="flex items-center gap-2 mb-2 text-nebula-400">
              <Target className="w-5 h-5" />
              <span className="text-sm font-mono uppercase tracking-wider">Step 2</span>
            </div>
            <h2 className="font-display font-bold text-3xl mb-2">What are you aiming for?</h2>
            <p className="text-slate-400 mb-6">This helps me calibrate your missions and difficulty.</p>
            <div className="space-y-3">
              {(['JEE Main', 'JEE Advanced', 'Both'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTarget(t)}
                  className={`w-full p-4 rounded-xl border text-left transition-all ${
                    target === t
                      ? 'border-nebula-500/50 bg-nebula-500/10 glow-purple'
                      : 'border-void-700 bg-void-800/50 hover:border-nebula-500/30'
                  }`}
                >
                  <span className="font-display font-semibold text-lg">{t}</span>
                  <p className="text-sm text-slate-400 mt-0.5">
                    {t === 'JEE Main' && 'Focus on JEE Main syllabus and pattern'}
                    {t === 'JEE Advanced' && 'Higher difficulty, advanced problem-solving'}
                    {t === 'Both' && 'Comprehensive prep for both exams'}
                  </p>
                </button>
              ))}
            </div>
            <div className="flex justify-between mt-6">
              <button onClick={() => setStep('name')} className="btn-ghost inline-flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button onClick={() => setStep('level')} className="btn-primary inline-flex items-center gap-2">
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 'level' && (
          <div className="glass-card p-8 animate-scale-in">
            <div className="flex items-center gap-2 mb-2 text-nebula-400">
              <BookOpen className="w-5 h-5" />
              <span className="text-sm font-mono uppercase tracking-wider">Step 3</span>
            </div>
            <h2 className="font-display font-bold text-3xl mb-2">Where are you at?</h2>
            <p className="text-slate-400 mb-6">Be honest — I'll adapt to your level.</p>
            <div className="space-y-3">
              {([
                { id: 'beginner', label: 'Just Starting', desc: 'New to JEE prep, building fundamentals' },
                { id: 'intermediate', label: 'In the Grind', desc: 'Comfortable with basics, pushing harder' },
                { id: 'advanced', label: 'Final Push', desc: 'Strong base, polishing and mock-focused' },
              ] as const).map((l) => (
                <button
                  key={l.id}
                  onClick={() => setLevel(l.id)}
                  className={`w-full p-4 rounded-xl border text-left transition-all ${
                    level === l.id
                      ? 'border-nebula-500/50 bg-nebula-500/10 glow-purple'
                      : 'border-void-700 bg-void-800/50 hover:border-nebula-500/30'
                  }`}
                >
                  <span className="font-display font-semibold text-lg">{l.label}</span>
                  <p className="text-sm text-slate-400 mt-0.5">{l.desc}</p>
                </button>
              ))}
            </div>
            <div className="flex justify-between mt-6">
              <button onClick={() => setStep('target')} className="btn-ghost inline-flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button onClick={() => setStep('weak')} className="btn-primary inline-flex items-center gap-2">
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 'weak' && (
          <div className="glass-card p-8 animate-scale-in">
            <div className="flex items-center gap-2 mb-2 text-nebula-400">
              <BookOpen className="w-5 h-5" />
              <span className="text-sm font-mono uppercase tracking-wider">Step 4</span>
            </div>
            <h2 className="font-display font-bold text-3xl mb-2">What's giving you trouble?</h2>
            <p className="text-slate-400 mb-6">Pick your weak chapters. I'll prioritize these in your plan.</p>
            <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto scrollbar-thin">
              {weakChapterOptions.map((ch) => {
                const selected = weakChapters.includes(ch);
                return (
                  <button
                    key={ch}
                    onClick={() => toggleWeak(ch)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      selected
                        ? 'bg-rose-500/20 border border-rose-500/40 text-rose-400'
                        : 'bg-void-800/50 border border-void-700 text-slate-400 hover:border-nebula-500/30'
                    }`}
                  >
                    {selected && <Check className="w-3 h-3 inline mr-1" />}
                    {ch}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-slate-500 mt-3">You can change these later. Skip if nothing feels particularly weak.</p>
            <div className="flex justify-between mt-6">
              <button onClick={() => setStep('level')} className="btn-ghost inline-flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button onClick={() => setStep('capacity')} className="btn-primary inline-flex items-center gap-2">
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 'capacity' && (
          <div className="glass-card p-8 animate-scale-in">
            <div className="flex items-center gap-2 mb-2 text-nebula-400">
              <Clock className="w-5 h-5" />
              <span className="text-sm font-mono uppercase tracking-wider">Step 5</span>
            </div>
            <h2 className="font-display font-bold text-3xl mb-2">How much can you study?</h2>
            <p className="text-slate-400 mb-6">On a good day, how many hours of focused study can you realistically do? Be honest — I'll work with what you've got.</p>
            <div className="text-center mb-6">
              <span className="font-display font-black text-6xl gradient-text">{capacity}h</span>
              <span className="text-slate-500 text-xl ml-2">/ day</span>
            </div>
            <input
              type="range"
              min="1"
              max="12"
              value={capacity}
              onChange={(e) => setCapacity(parseInt(e.target.value))}
              className="w-full accent-nebula-500"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>1h</span>
              <span>6h</span>
              <span>12h</span>
            </div>
            <div className="flex justify-between mt-6">
              <button onClick={() => setStep('weak')} className="btn-ghost inline-flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button onClick={() => setStep('schedule')} className="btn-primary inline-flex items-center gap-2">
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 'schedule' && (
          <div className="glass-card p-8 animate-scale-in">
            <div className="flex items-center gap-2 mb-2 text-nebula-400">
              <Sparkles className="w-5 h-5" />
              <span className="text-sm font-mono uppercase tracking-wider">Step 6 — The Important One</span>
            </div>
            <h2 className="font-display font-bold text-3xl mb-2">
              Tell me your normal day.
            </h2>
            <p className="text-slate-300 mb-2">
              Talk normally. Slang, shortcuts, messy sentences — everything is fine. Just tell me how your typical week looks.
            </p>
            <p className="text-slate-500 text-sm mb-4">
              I'll figure out the times, activities, and study windows automatically.
            </p>
            <textarea
              value={scheduleText}
              onChange={(e) => setScheduleText(e.target.value)}
              placeholder={SAMPLE_SCHEDULE}
              className="input-field min-h-[120px] resize-none text-base leading-relaxed"
              autoFocus
            />
            <div className="flex items-center gap-2 mt-3 text-xs text-slate-500">
              <Zap className="w-3.5 h-3.5 text-nebula-400" />
              <span>Try: "school 8 to 3, coaching mon wed fri 6-8, usually study after dinner"</span>
            </div>
            <div className="flex justify-between mt-6">
              <button onClick={() => setStep('capacity')} className="btn-ghost inline-flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={handleParseSchedule}
                disabled={scheduleText.trim().length < 10}
                className="btn-primary inline-flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Parse My Schedule <Sparkles className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 'review' && parsed && (
          <div className="glass-card p-8 animate-scale-in">
            <div className="flex items-center gap-2 mb-2 text-electric-400">
              <Check className="w-5 h-5" />
              <span className="text-sm font-mono uppercase tracking-wider">Here's what I understood</span>
            </div>
            <h2 className="font-display font-bold text-2xl mb-4">Your Schedule</h2>

            <div className="space-y-2 mb-4">
              {parsed.understood.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-void-800/50 border border-void-700">
                  <div>
                    <span className="font-display font-semibold text-nebula-300">{item.label}</span>
                    <span className="text-xs text-slate-500 ml-2">{item.days}</span>
                  </div>
                  <span className="font-mono text-sm text-electric-300">{item.time}</span>
                </div>
              ))}
            </div>

            {parsed.studyWindows.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-mono uppercase text-emerald-400 mb-2">Available Study Windows</h3>
                <div className="flex flex-wrap gap-2">
                  {parsed.studyWindows.map((w, i) => (
                    <div key={i} className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-mono">
                      {formatTime(w.start)} — {formatTime(w.end)}
                      <span className="text-emerald-600 ml-1">({formatDuration(w.end - w.start)})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {parsed.warnings.length > 0 && (
              <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <p className="text-sm text-amber-400 font-medium mb-1">Heads up:</p>
                {parsed.warnings.map((w, i) => (
                  <p key={i} className="text-xs text-amber-300">{w}</p>
                ))}
              </div>
            )}

            {showCorrection ? (
              <div className="mb-4">
                <p className="text-sm text-slate-300 mb-2">Tell me what to change:</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={correctionText}
                    onChange={(e) => setCorrectionText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && correctionText.trim() && handleCorrection()}
                    placeholder="e.g., coaching is 7 to 9 not 6 to 8"
                    className="input-field"
                    autoFocus
                  />
                  <button onClick={handleCorrection} disabled={!correctionText.trim()} className="btn-primary disabled:opacity-40">
                    Fix
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowCorrection(true)} className="text-sm text-nebula-400 hover:text-nebula-300 underline">
                Change something
              </button>
            )}

            <div className="flex justify-between mt-6">
              <button onClick={() => setStep('schedule')} className="btn-ghost inline-flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" /> Edit
              </button>
              <button onClick={handleComplete} className="btn-primary inline-flex items-center gap-2 text-lg px-8">
                Activate Ascension <Zap className="w-5 h-5" fill="white" />
              </button>
            </div>
          </div>
        )}

        {step === 'activating' && (
          <div className="text-center animate-fade-in py-20">
            <div className="flex justify-center mb-8">
              <Mascot level={1} size={140} expression="excited" />
            </div>
            <h2 className="font-display font-black text-4xl gradient-text mb-4 animate-pulse-glow">
              ASCENSION PROTOCOL ACTIVATED
            </h2>
            <p className="text-slate-400 text-lg">Generating your first day...</p>
            <div className="flex justify-center gap-2 mt-6">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-nebula-400 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
