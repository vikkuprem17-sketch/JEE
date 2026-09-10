import { createContext, useContext, useEffect, useReducer, type ReactNode, useCallback } from 'react';
import type { AppState, Task, ChatMessage, ScheduleException, TimeBlock, EnergyLevel, StudySession } from '@/types';
import { createSeedState } from '@/lib/seedData';
import { getLevelFromXp, getMascotStage, getConsistencyTier, generateDailyTasks, getStudyWindowsForDate } from '@/lib/scheduleEngine';

const STORAGE_KEY = 'jee-ascend-state-v1';

type Action =
  | { type: 'SET_STATE'; state: AppState }
  | { type: 'UPDATE_PROFILE'; profile: Partial<AppState['profile']> }
  | { type: 'SET_BASE_SCHEDULE'; schedule: TimeBlock[] }
  | { type: 'ADD_EXCEPTION'; exception: ScheduleException }
  | { type: 'SET_TASKS'; tasks: Task[] }
  | { type: 'ADD_TASK'; task: Task }
  | { type: 'UPDATE_TASK'; id: string; updates: Partial<Task> }
  | { type: 'COMPLETE_TASK'; id: string; actualDuration: number; pyqCorrect?: number; pyqWrong?: number }
  | { type: 'ADD_SESSION'; session: StudySession }
  | { type: 'ADD_CHAT'; message: ChatMessage }
  | { type: 'SET_ENERGY'; energy: EnergyLevel }
  | { type: 'ADD_XP'; amount: number }
  | { type: 'UPDATE_STATS'; stats: Partial<AppState['stats']> }
  | { type: 'ADD_CHANGE'; change: AppState['changes'][0] }
  | { type: 'ADD_DAY_LOG'; log: AppState['dayLogs'][0] }
  | { type: 'UPDATE_ACHIEVEMENT'; id: string; updates: Partial<AppState['achievements'][0]> }
  | { type: 'COMPLETE_REVISION'; id: string; performance: number }
  | { type: 'ADD_MOCK'; mock: AppState['mocks'][0] }
  | { type: 'ADD_ERROR'; error: AppState['errors'][0] }
  | { type: 'RESOLVE_ERROR'; id: string }
  | { type: 'RESET' };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_STATE':
      return action.state;

    case 'UPDATE_PROFILE':
      return { ...state, profile: { ...state.profile, ...action.profile } };

    case 'SET_BASE_SCHEDULE':
      return { ...state, baseSchedule: action.schedule };

    case 'ADD_EXCEPTION':
      return { ...state, exceptions: [...state.exceptions, action.exception] };

    case 'SET_TASKS':
      return { ...state, tasks: action.tasks };

    case 'ADD_TASK':
      return { ...state, tasks: [...state.tasks, action.task] };

    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map((t) => (t.id === action.id ? { ...t, ...action.updates } : t)),
      };

    case 'COMPLETE_TASK': {
      const task = state.tasks.find((t) => t.id === action.id);
      if (!task) return state;
      const updatedTasks = state.tasks.map((t) =>
        t.id === action.id
          ? {
              ...t,
              status: 'completed' as const,
              actualDuration: action.actualDuration,
              pyqCorrect: action.pyqCorrect,
              pyqWrong: action.pyqWrong,
              accuracy: action.pyqCorrect !== undefined && t.pyqCount ? (action.pyqCorrect / t.pyqCount) * 100 : undefined,
            }
          : t
      );
      return { ...state, tasks: updatedTasks };
    }

    case 'ADD_SESSION':
      return { ...state, sessions: [...state.sessions, action.session] };

    case 'ADD_CHAT':
      return { ...state, chat: [...state.chat, action.message] };

    case 'SET_ENERGY':
      return { ...state, currentEnergy: action.energy };

    case 'ADD_XP': {
      const newTotalXp = state.stats.totalXp + action.amount;
      const { level, xp, xpToNext } = getLevelFromXp(newTotalXp);
      return {
        ...state,
        stats: {
          ...state.stats,
          totalXp: newTotalXp,
          level,
          xp,
          xpToNext,
          mascotStage: getMascotStage(level),
        },
      };
    }

    case 'UPDATE_STATS':
      return { ...state, stats: { ...state.stats, ...action.stats } };

    case 'ADD_CHANGE':
      return { ...state, changes: [...state.changes, action.change] };

    case 'ADD_DAY_LOG':
      return { ...state, dayLogs: [...state.dayLogs, action.log] };

    case 'UPDATE_ACHIEVEMENT':
      return {
        ...state,
        achievements: state.achievements.map((a) =>
          a.id === action.id ? { ...a, ...action.updates } : a
        ),
      };

    case 'COMPLETE_REVISION':
      return {
        ...state,
        revisions: state.revisions.map((r) =>
          r.id === action.id ? { ...r, completed: true, performance: action.performance } : r
        ),
      };

    case 'ADD_MOCK':
      return { ...state, mocks: [action.mock, ...state.mocks] };

    case 'ADD_ERROR':
      return { ...state, errors: [action.error, ...state.errors] };

    case 'RESOLVE_ERROR':
      return {
        ...state,
        errors: state.errors.map((e) => (e.id === action.id ? { ...e, resolved: true } : e)),
      };

    case 'RESET':
      return createSeedState();

    default:
      return state;
  }
}

function loadState(): AppState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...createSeedState(), ...parsed, stats: { ...createSeedState().stats, ...parsed.stats } };
    }
  } catch {
    // ignore
  }
  return createSeedState();
}

interface StoreContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  completeTask: (id: string, actualDuration: number, pyqCorrect?: number, pyqWrong?: number) => void;
  addXp: (amount: number) => void;
  setEnergy: (energy: EnergyLevel) => void;
  addChat: (message: ChatMessage) => void;
  regenerateTasks: () => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [state]);

  const completeTask = useCallback((id: string, actualDuration: number, pyqCorrect?: number, pyqWrong?: number) => {
    dispatch({ type: 'COMPLETE_TASK', id, actualDuration, pyqCorrect, pyqWrong });
  }, []);

  const addXp = useCallback((amount: number) => {
    dispatch({ type: 'ADD_XP', amount });
  }, []);

  const setEnergy = useCallback((energy: EnergyLevel) => {
    dispatch({ type: 'SET_ENERGY', energy });
  }, []);

  const addChat = useCallback((message: ChatMessage) => {
    dispatch({ type: 'ADD_CHAT', message });
  }, []);

  const regenerateTasks = useCallback(() => {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const windows = getStudyWindowsForDate(state.baseSchedule, state.exceptions, today);
    const tasks = generateDailyTasks(state.chapters, windows, state.currentEnergy, dateStr, state.tasks);
    dispatch({ type: 'SET_TASKS', tasks });
  }, [state.baseSchedule, state.exceptions, state.chapters, state.currentEnergy, state.tasks]);

  return (
    <StoreContext.Provider value={{ state, dispatch, completeTask, addXp, setEnergy, addChat, regenerateTasks }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
