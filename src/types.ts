export type SubjectId = 'physics' | 'chemistry' | 'mathematics';

export type EnergyLevel = 'high' | 'normal' | 'low' | 'dead';

export type TaskType = 'study' | 'revision' | 'pyq' | 'mock' | 'break' | 'drill';

export type MissionType = 'main' | 'side' | 'memory' | 'boss';

export type MistakeType =
  | 'concept'
  | 'calculation'
  | 'silly'
  | 'formula'
  | 'misread'
  | 'time_pressure'
  | 'wrong_approach'
  | 'guess';

export interface TimeBlock {
  start: number; // minutes from midnight
  end: number;
  label: string;
  type: 'school' | 'coaching' | 'travel' | 'meal' | 'sleep' | 'study' | 'break' | 'exercise' | 'personal' | 'free';
  days?: number[]; // 0=Sun..6=Sat. undefined = all days
  isStudyWindow?: boolean;
}

export interface ScheduleException {
  id: string;
  date: string; // ISO date string YYYY-MM-DD
  description: string;
  blocks: TimeBlock[];
  createdAt: number;
}

export interface StudySession {
  id: string;
  taskId: string;
  subject: SubjectId;
  chapter: string;
  startedAt: number;
  endedAt: number;
  duration: number; // minutes
  plannedDuration: number;
  completed: boolean;
  xpEarned: number;
}

export interface Task {
  id: string;
  subject: SubjectId;
  chapter: string;
  title: string;
  type: TaskType;
  missionType: MissionType;
  duration: number; // planned minutes
  priority: number; // 1-10
  status: 'pending' | 'in_progress' | 'completed' | 'missed' | 'skipped';
  date: string; // ISO date
  startTime?: number; // minutes from midnight
  estimatedDuration?: number;
  actualDuration?: number;
  pyqCount?: number;
  pyqCorrect?: number;
  pyqWrong?: number;
  accuracy?: number;
  xpReward: number;
}

export interface Chapter {
  id: string;
  subject: SubjectId;
  name: string;
  conceptMastery: number; // 0-100
  pyqMastery: number;
  accuracy: number;
  speed: number; // 0-100
  revisionStatus: 'fresh' | 'due_soon' | 'due' | 'overdue';
  lastRevised?: number;
  nextRevision?: number;
  totalPyqs: number;
  correctPyqs: number;
  mistakes: number;
  isWeak: boolean;
}

export interface PYQ {
  id: string;
  year: number;
  subject: SubjectId;
  chapter: string;
  question: string;
  difficulty: 'easy' | 'medium' | 'hard';
  correct: boolean | null;
  timeTaken?: number;
  mistakeType?: MistakeType;
  date: string;
}

export interface MockTest {
  id: string;
  name: string;
  date: string;
  score: number;
  maxScore: number;
  percentile: number;
  estimatedRankRange: string;
  physicsScore: number;
  chemistryScore: number;
  mathsScore: number;
  attempted: number;
  correct: number;
  wrong: number;
  unattempted: number;
  accuracy: number;
  timeDistribution: { subject: SubjectId; minutes: number; marks: number }[];
  totalQuestions: number;
}

export interface ErrorEntry {
  id: string;
  date: string;
  subject: SubjectId;
  chapter: string;
  type: MistakeType;
  question: string;
  note?: string;
  resolved: boolean;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: number;
  progress: number;
  target: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
}

export interface RevisionItem {
  id: string;
  subject: SubjectId;
  chapter: string;
  stage: number; // 0-5 (24h, 3d, 7d, 14d, 30d, 60d)
  scheduledDate: string;
  completed: boolean;
  performance?: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: number;
  action?: 'reschedule' | 'add_exception' | 'update_energy' | 'task_done' | 'new_day' | 'none';
}

export interface ScheduleChange {
  id: string;
  date: string;
  description: string;
  reason: string;
  timestamp: number;
}

export interface UserProfile {
  name: string;
  jeeTarget: 'JEE Main' | 'JEE Advanced' | 'Both';
  examDate: string;
  preparationLevel: 'beginner' | 'intermediate' | 'advanced';
  weakChapters: string[];
  studyCapacity: number; // hours per day they aim for
  onboarded: boolean;
}

export interface GameStats {
  level: number;
  xp: number;
  xpToNext: number;
  totalXp: number;
  streak: number;
  bestStreak: number;
  lastStudyDate: string;
  focusPoints: number;
  consistencyScore: number;
  consistencyTier: string;
  mascotStage: string;
}

export interface DayLog {
  date: string;
  plannedMinutes: number;
  completedMinutes: number;
  pyqsAttempted: number;
  pyqsCorrect: number;
  energy: EnergyLevel;
  tasksCompleted: number;
  tasksTotal: number;
}

export interface AppState {
  profile: UserProfile;
  baseSchedule: TimeBlock[];
  exceptions: ScheduleException[];
  tasks: Task[];
  sessions: StudySession[];
  chapters: Chapter[];
  pyqs: PYQ[];
  mocks: MockTest[];
  errors: ErrorEntry[];
  achievements: Achievement[];
  revisions: RevisionItem[];
  chat: ChatMessage[];
  changes: ScheduleChange[];
  dayLogs: DayLog[];
  stats: GameStats;
  currentEnergy: EnergyLevel;
}
