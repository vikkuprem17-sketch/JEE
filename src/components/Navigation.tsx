import { Home, BookOpen, Brain, BarChart3, Trophy, FlaskConical, Target, Zap, MessageCircle } from 'lucide-react';

export type ViewId = 'dashboard' | 'subjects' | 'mentor' | 'analytics' | 'achievements' | 'mocks' | 'errors' | 'revision' | 'pyqs';

interface NavItem {
  id: ViewId;
  label: string;
  icon: typeof Home;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Command Center', icon: Home },
  { id: 'subjects', label: 'Subjects', icon: BookOpen },
  { id: 'mentor', label: 'Ascend AI', icon: MessageCircle },
  { id: 'pyqs', label: 'PYQ Engine', icon: Target },
  { id: 'revision', label: 'Revision', icon: Zap },
  { id: 'mocks', label: 'Mock Tests', icon: FlaskConical },
  { id: 'errors', label: 'Error Log', icon: Brain },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'achievements', label: 'Achievements', icon: Trophy },
];

interface NavigationProps {
  current: ViewId;
  onNavigate: (view: ViewId) => void;
}

export function Navigation({ current, onNavigate }: NavigationProps) {
  return (
    <>
      {/* Desktop sidebar */}
      <nav className="hidden lg:flex fixed left-0 top-0 h-screen w-64 glass-strong border-r border-nebula-500/15 flex-col z-40">
        <div className="p-6 border-b border-nebula-500/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-nebula-500 to-electric-500 flex items-center justify-center glow-purple">
              <Zap className="w-6 h-6 text-white" fill="white" />
            </div>
            <div>
              <h1 className="font-display font-black text-lg leading-none gradient-text">JEE ASCEND</h1>
              <p className="text-xs text-slate-500 mt-0.5">AI Productivity OS</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin py-4 px-3">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = current === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-1 transition-all duration-200 ${
                  isActive
                    ? 'bg-nebula-500/15 text-nebula-400 border border-nebula-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium text-sm">{item.label}</span>
                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-nebula-400 animate-pulse" />}
              </button>
            );
          })}
        </div>

        <div className="p-4 border-t border-nebula-500/10">
          <div className="text-xs text-slate-600 text-center">
            <p className="font-mono">v1.0 · ASCENSION</p>
          </div>
        </div>
      </nav>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 glass-strong border-t border-nebula-500/15 z-40">
        <div className="flex items-center justify-around px-2 py-2 overflow-x-auto scrollbar-hide">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = current === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg transition-all flex-shrink-0 ${
                  isActive ? 'text-nebula-400' : 'text-slate-500'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
