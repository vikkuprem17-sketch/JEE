import type { AppState, Chapter, MockTest, ErrorEntry, Achievement, PYQ, RevisionItem, Task, DayLog, GameStats, UserProfile, TimeBlock } from '@/types';
import { getDateStr } from './scheduleEngine';

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return getDateStr(d);
}

function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return getDateStr(d);
}

const JEE_CHAPTERS: Omit<Chapter, 'id'>[] = [
  // Physics
  { subject: 'physics', name: 'Kinematics', conceptMastery: 78, pyqMastery: 72, accuracy: 81, speed: 75, revisionStatus: 'fresh', totalPyqs: 45, correctPyqs: 36, mistakes: 9, isWeak: false },
  { subject: 'physics', name: 'Laws of Motion', conceptMastery: 71, pyqMastery: 65, accuracy: 73, speed: 68, revisionStatus: 'due_soon', totalPyqs: 38, correctPyqs: 28, mistakes: 10, isWeak: false },
  { subject: 'physics', name: 'Work, Energy & Power', conceptMastery: 85, pyqMastery: 80, accuracy: 88, speed: 82, revisionStatus: 'fresh', totalPyqs: 30, correctPyqs: 26, mistakes: 4, isWeak: false },
  { subject: 'physics', name: 'Rotational Motion', conceptMastery: 52, pyqMastery: 45, accuracy: 58, speed: 49, revisionStatus: 'overdue', totalPyqs: 42, correctPyqs: 24, mistakes: 18, isWeak: true },
  { subject: 'physics', name: 'Gravitation', conceptMastery: 68, pyqMastery: 62, accuracy: 70, speed: 65, revisionStatus: 'due', totalPyqs: 25, correctPyqs: 17, mistakes: 8, isWeak: false },
  { subject: 'physics', name: 'Current Electricity', conceptMastery: 64, pyqMastery: 58, accuracy: 67, speed: 62, revisionStatus: 'due', totalPyqs: 35, correctPyqs: 23, mistakes: 12, isWeak: true },
  { subject: 'physics', name: 'Electrostatics', conceptMastery: 58, pyqMastery: 50, accuracy: 61, speed: 55, revisionStatus: 'overdue', totalPyqs: 40, correctPyqs: 24, mistakes: 16, isWeak: true },
  { subject: 'physics', name: 'Magnetism', conceptMastery: 73, pyqMastery: 68, accuracy: 76, speed: 70, revisionStatus: 'fresh', totalPyqs: 28, correctPyqs: 21, mistakes: 7, isWeak: false },
  { subject: 'physics', name: 'Optics', conceptMastery: 80, pyqMastery: 75, accuracy: 84, speed: 78, revisionStatus: 'fresh', totalPyqs: 32, correctPyqs: 27, mistakes: 5, isWeak: false },
  { subject: 'physics', name: 'Modern Physics', conceptMastery: 76, pyqMastery: 70, accuracy: 79, speed: 73, revisionStatus: 'due_soon', totalPyqs: 36, correctPyqs: 28, mistakes: 8, isWeak: false },
  { subject: 'physics', name: 'Thermodynamics', conceptMastery: 69, pyqMastery: 63, accuracy: 72, speed: 66, revisionStatus: 'due', totalPyqs: 30, correctPyqs: 21, mistakes: 9, isWeak: false },

  // Chemistry
  { subject: 'chemistry', name: 'Atomic Structure', conceptMastery: 82, pyqMastery: 78, accuracy: 85, speed: 80, revisionStatus: 'fresh', totalPyqs: 28, correctPyqs: 24, mistakes: 4, isWeak: false },
  { subject: 'chemistry', name: 'Chemical Bonding', conceptMastery: 75, pyqMastery: 70, accuracy: 78, speed: 72, revisionStatus: 'due_soon', totalPyqs: 35, correctPyqs: 27, mistakes: 8, isWeak: false },
  { subject: 'chemistry', name: 'Thermodynamics (Chem)', conceptMastery: 66, pyqMastery: 60, accuracy: 69, speed: 63, revisionStatus: 'due', totalPyqs: 25, correctPyqs: 17, mistakes: 8, isWeak: true },
  { subject: 'chemistry', name: 'Chemical Equilibrium', conceptMastery: 70, pyqMastery: 65, accuracy: 73, speed: 68, revisionStatus: 'due_soon', totalPyqs: 30, correctPyqs: 22, mistakes: 8, isWeak: false },
  { subject: 'chemistry', name: 'Electrochemistry', conceptMastery: 55, pyqMastery: 48, accuracy: 59, speed: 52, revisionStatus: 'overdue', totalPyqs: 28, correctPyqs: 16, mistakes: 12, isWeak: true },
  { subject: 'chemistry', name: 'GOC (Organic)', conceptMastery: 48, pyqMastery: 40, accuracy: 52, speed: 45, revisionStatus: 'overdue', totalPyqs: 45, correctPyqs: 23, mistakes: 22, isWeak: true },
  { subject: 'chemistry', name: 'Hydrocarbons', conceptMastery: 62, pyqMastery: 55, accuracy: 65, speed: 58, revisionStatus: 'due', totalPyqs: 30, correctPyqs: 19, mistakes: 11, isWeak: true },
  { subject: 'chemistry', name: 'Aldehydes & Ketones', conceptMastery: 68, pyqMastery: 62, accuracy: 71, speed: 65, revisionStatus: 'due_soon', totalPyqs: 28, correctPyqs: 20, mistakes: 8, isWeak: false },
  { subject: 'chemistry', name: 'Coordination Compounds', conceptMastery: 73, pyqMastery: 68, accuracy: 76, speed: 70, revisionStatus: 'fresh', totalPyqs: 25, correctPyqs: 19, mistakes: 6, isWeak: false },
  { subject: 'chemistry', name: 'p-Block Elements', conceptMastery: 65, pyqMastery: 58, accuracy: 68, speed: 60, revisionStatus: 'due', totalPyqs: 32, correctPyqs: 21, mistakes: 11, isWeak: true },
  { subject: 'chemistry', name: 'd & f Block', conceptMastery: 71, pyqMastery: 66, accuracy: 74, speed: 68, revisionStatus: 'fresh', totalPyqs: 22, correctPyqs: 16, mistakes: 6, isWeak: false },

  // Mathematics
  { subject: 'mathematics', name: 'Quadratic Equations', conceptMastery: 84, pyqMastery: 80, accuracy: 87, speed: 82, revisionStatus: 'fresh', totalPyqs: 35, correctPyqs: 30, mistakes: 5, isWeak: false },
  { subject: 'mathematics', name: 'Sequences & Series', conceptMastery: 72, pyqMastery: 66, accuracy: 75, speed: 70, revisionStatus: 'due_soon', totalPyqs: 30, correctPyqs: 22, mistakes: 8, isWeak: false },
  { subject: 'mathematics', name: 'Trigonometry', conceptMastery: 68, pyqMastery: 62, accuracy: 71, speed: 65, revisionStatus: 'due', totalPyqs: 40, correctPyqs: 28, mistakes: 12, isWeak: true },
  { subject: 'mathematics', name: 'Limits & Continuity', conceptMastery: 75, pyqMastery: 70, accuracy: 78, speed: 73, revisionStatus: 'fresh', totalPyqs: 28, correctPyqs: 22, mistakes: 6, isWeak: false },
  { subject: 'mathematics', name: 'Differentiation', conceptMastery: 70, pyqMastery: 64, accuracy: 73, speed: 68, revisionStatus: 'due_soon', totalPyqs: 35, correctPyqs: 25, mistakes: 10, isWeak: false },
  { subject: 'mathematics', name: 'Definite Integration', conceptMastery: 50, pyqMastery: 42, accuracy: 55, speed: 48, revisionStatus: 'overdue', totalPyqs: 38, correctPyqs: 21, mistakes: 17, isWeak: true },
  { subject: 'mathematics', name: 'Differential Equations', conceptMastery: 60, pyqMastery: 53, accuracy: 63, speed: 56, revisionStatus: 'due', totalPyqs: 25, correctPyqs: 16, mistakes: 9, isWeak: true },
  { subject: 'mathematics', name: 'Vectors & 3D Geometry', conceptMastery: 78, pyqMastery: 73, accuracy: 81, speed: 76, revisionStatus: 'fresh', totalPyqs: 30, correctPyqs: 24, mistakes: 6, isWeak: false },
  { subject: 'mathematics', name: 'Probability', conceptMastery: 64, pyqMastery: 58, accuracy: 67, speed: 62, revisionStatus: 'due', totalPyqs: 32, correctPyqs: 21, mistakes: 11, isWeak: true },
  { subject: 'mathematics', name: 'Complex Numbers', conceptMastery: 66, pyqMastery: 60, accuracy: 69, speed: 64, revisionStatus: 'due_soon', totalPyqs: 28, correctPyqs: 19, mistakes: 9, isWeak: false },
  { subject: 'mathematics', name: 'Conic Sections', conceptMastery: 73, pyqMastery: 68, accuracy: 76, speed: 71, revisionStatus: 'fresh', totalPyqs: 35, correctPyqs: 27, mistakes: 8, isWeak: false },
];

const SEED_MOCKS: MockTest[] = [
  {
    id: 'mock_1',
    name: 'Full Syllabus Mock #7',
    date: daysAgo(2),
    score: 168,
    maxScore: 300,
    percentile: 92.4,
    estimatedRankRange: '8,500 — 12,000',
    physicsScore: 62,
    chemistryScore: 48,
    mathsScore: 58,
    attempted: 72,
    correct: 56,
    wrong: 16,
    unattempted: 3,
    accuracy: 77.8,
    timeDistribution: [
      { subject: 'physics', minutes: 55, marks: 62 },
      { subject: 'chemistry', minutes: 40, marks: 48 },
      { subject: 'mathematics', minutes: 65, marks: 58 },
    ],
    totalQuestions: 75,
  },
  {
    id: 'mock_2',
    name: 'Full Syllabus Mock #6',
    date: daysAgo(9),
    score: 152,
    maxScore: 300,
    percentile: 88.1,
    estimatedRankRange: '14,000 — 18,000',
    physicsScore: 58,
    chemistryScore: 42,
    mathsScore: 52,
    attempted: 68,
    correct: 50,
    wrong: 18,
    unattempted: 7,
    accuracy: 73.5,
    timeDistribution: [
      { subject: 'physics', minutes: 50, marks: 58 },
      { subject: 'chemistry', minutes: 45, marks: 42 },
      { subject: 'mathematics', minutes: 65, marks: 52 },
    ],
    totalQuestions: 75,
  },
  {
    id: 'mock_3',
    name: 'Full Syllabus Mock #5',
    date: daysAgo(16),
    score: 138,
    maxScore: 300,
    percentile: 83.5,
    estimatedRankRange: '20,000 — 26,000',
    physicsScore: 52,
    chemistryScore: 38,
    mathsScore: 48,
    attempted: 65,
    correct: 46,
    wrong: 19,
    unattempted: 10,
    accuracy: 70.8,
    timeDistribution: [
      { subject: 'physics', minutes: 48, marks: 52 },
      { subject: 'chemistry', minutes: 42, marks: 38 },
      { subject: 'mathematics', minutes: 70, marks: 48 },
    ],
    totalQuestions: 75,
  },
];

const SEED_ERRORS: ErrorEntry[] = [
  { id: 'err_1', date: daysAgo(1), subject: 'physics', chapter: 'Rotational Motion', type: 'concept', question: 'A disc rolls without slipping — find the total KE', resolved: false },
  { id: 'err_2', date: daysAgo(1), subject: 'physics', chapter: 'Electrostatics', type: 'calculation', question: 'Electric field due to charged ring at axial point', resolved: false },
  { id: 'err_3', date: daysAgo(2), subject: 'chemistry', chapter: 'GOC (Organic)', type: 'wrong_approach', question: 'Identify the major product of SN1 reaction', resolved: false },
  { id: 'err_4', date: daysAgo(2), subject: 'mathematics', chapter: 'Definite Integration', type: 'calculation', question: 'Evaluate integral using King property', resolved: false },
  { id: 'err_5', date: daysAgo(3), subject: 'physics', chapter: 'Current Electricity', type: 'silly', question: 'Equivalent resistance of cube network', resolved: true },
  { id: 'err_6', date: daysAgo(3), subject: 'chemistry', chapter: 'Electrochemistry', type: 'formula', question: 'Nernst equation application at 298K', resolved: false },
  { id: 'err_7', date: daysAgo(4), subject: 'mathematics', chapter: 'Trigonometry', type: 'misread', question: 'Find general solution of sin2x = cos3x', resolved: true },
  { id: 'err_8', date: daysAgo(4), subject: 'physics', chapter: 'Rotational Motion', type: 'calculation', question: 'Moment of inertia of hollow cone', resolved: false },
  { id: 'err_9', date: daysAgo(5), subject: 'chemistry', chapter: 'Hydrocarbons', type: 'concept', question: 'Markovnikov vs anti-Markovnikov addition', resolved: false },
  { id: 'err_10', date: daysAgo(5), subject: 'mathematics', chapter: 'Probability', type: 'time_pressure', question: 'Bayes theorem application in exam', resolved: false },
  { id: 'err_11', date: daysAgo(6), subject: 'physics', chapter: 'Electrostatics', type: 'concept', question: 'Gauss law for non-symmetric charge', resolved: false },
  { id: 'err_12', date: daysAgo(6), subject: 'mathematics', chapter: 'Definite Integration', type: 'silly', question: 'Substitution forgot to change limits', resolved: true },
];

const SEED_ACHIEVEMENTS: Achievement[] = [
  { id: 'ach_1', name: '7-Day Warrior', description: 'Study 7 days in a row', icon: 'flame', unlocked: true, unlockedAt: Date.now() - 86400000 * 14, progress: 7, target: 7, tier: 'bronze' },
  { id: 'ach_2', name: '30-Day Grinder', description: 'Study 30 days in a row', icon: 'calendar', unlocked: false, progress: 21, target: 30, tier: 'silver' },
  { id: 'ach_3', name: '1000 PYQs', description: 'Solve 1000 PYQs', icon: 'book', unlocked: false, progress: 647, target: 1000, tier: 'silver' },
  { id: 'ach_4', name: '100 Hours', description: 'Study 100 total hours', icon: 'clock', unlocked: true, unlockedAt: Date.now() - 86400000 * 7, progress: 127, target: 100, tier: 'bronze' },
  { id: 'ach_5', name: '90% Accuracy', description: 'Hit 90% accuracy on a PYQ set', icon: 'target', unlocked: false, progress: 84, target: 90, tier: 'gold' },
  { id: 'ach_6', name: 'Zero Backlog Week', description: 'Complete all tasks for a full week', icon: 'check-circle', unlocked: false, progress: 4, target: 7, tier: 'gold' },
  { id: 'ach_7', name: 'First 180+ Mock', description: 'Score 180+ on a mock test', icon: 'trophy', unlocked: false, progress: 168, target: 180, tier: 'gold' },
  { id: 'ach_8', name: 'Physics Destroyer', description: 'Master 80% of Physics chapters', icon: 'atom', unlocked: false, progress: 5, target: 11, tier: 'gold' },
  { id: 'ach_9', name: 'Calculus Master', description: '90% mastery in all Calculus chapters', icon: 'function', unlocked: false, progress: 60, target: 90, tier: 'platinum' },
  { id: 'ach_10', name: 'Organic Beast', description: '90% mastery in all Organic chapters', icon: 'flask', unlocked: false, progress: 48, target: 90, tier: 'platinum' },
];

const SEED_PYQS: PYQ[] = [
  { id: 'pyq_1', year: 2023, subject: 'physics', chapter: 'Rotational Motion', question: 'A solid sphere of mass M and radius R rolls without slipping down an inclined plane. Find its acceleration.', difficulty: 'medium', correct: null, date: getDateStr() },
  { id: 'pyq_2', year: 2022, subject: 'physics', chapter: 'Electrostatics', question: 'Two point charges q and -q are separated by distance 2a. Find the electric field at the midpoint.', difficulty: 'easy', correct: null, date: getDateStr() },
  { id: 'pyq_3', year: 2023, subject: 'chemistry', chapter: 'GOC (Organic)', question: 'The major product of the reaction of t-BuCl with NaCN in DMSO is?', difficulty: 'medium', correct: null, date: getDateStr() },
  { id: 'pyq_4', year: 2021, subject: 'mathematics', chapter: 'Definite Integration', question: 'Evaluate: ∫₀^π/² sin²x / (sin²x + cos²x) dx', difficulty: 'medium', correct: null, date: getDateStr() },
  { id: 'pyq_5', year: 2023, subject: 'mathematics', chapter: 'Probability', question: 'A bag contains 4 red and 6 black balls. Two balls are drawn at random. P(both red | at least one red)?', difficulty: 'hard', correct: null, date: getDateStr() },
];

const SEED_REVISIONS: RevisionItem[] = [
  { id: 'rev_1', subject: 'physics', chapter: 'Rotational Motion', stage: 3, scheduledDate: getDateStr(), completed: false },
  { id: 'rev_2', subject: 'chemistry', chapter: 'GOC (Organic)', stage: 2, scheduledDate: getDateStr(), completed: false },
  { id: 'rev_3', subject: 'mathematics', chapter: 'Definite Integration', stage: 4, scheduledDate: daysFromNow(1), completed: false },
  { id: 'rev_4', subject: 'physics', chapter: 'Electrostatics', stage: 1, scheduledDate: daysFromNow(2), completed: false },
  { id: 'rev_5', subject: 'chemistry', chapter: 'Electrochemistry', stage: 3, scheduledDate: daysFromNow(3), completed: false },
];

const SEED_DAY_LOGS: DayLog[] = [
  { date: daysAgo(6), plannedMinutes: 240, completedMinutes: 210, pyqsAttempted: 35, pyqsCorrect: 28, energy: 'normal', tasksCompleted: 4, tasksTotal: 5 },
  { date: daysAgo(5), plannedMinutes: 260, completedMinutes: 180, pyqsAttempted: 28, pyqsCorrect: 20, energy: 'low', tasksCompleted: 3, tasksTotal: 5 },
  { date: daysAgo(4), plannedMinutes: 220, completedMinutes: 220, pyqsAttempted: 40, pyqsCorrect: 33, energy: 'high', tasksCompleted: 5, tasksTotal: 5 },
  { date: daysAgo(3), plannedMinutes: 280, completedMinutes: 240, pyqsAttempted: 32, pyqsCorrect: 24, energy: 'normal', tasksCompleted: 4, tasksTotal: 5 },
  { date: daysAgo(2), plannedMinutes: 250, completedMinutes: 150, pyqsAttempted: 25, pyqsCorrect: 18, energy: 'low', tasksCompleted: 3, tasksTotal: 5 },
  { date: daysAgo(1), plannedMinutes: 270, completedMinutes: 230, pyqsAttempted: 38, pyqsCorrect: 30, energy: 'normal', tasksCompleted: 4, tasksTotal: 5 },
];

const DEFAULT_STATS: GameStats = {
  level: 17,
  xp: 7420,
  xpToNext: 8000,
  totalXp: 0,
  streak: 21,
  bestStreak: 28,
  lastStudyDate: daysAgo(0),
  focusPoints: 142,
  consistencyScore: 87,
  consistencyTier: 'ELITE',
  mascotStage: 'Scholar',
};

const DEFAULT_PROFILE: UserProfile = {
  name: '',
  jeeTarget: 'Both',
  examDate: '2027-01-22',
  preparationLevel: 'intermediate',
  weakChapters: [],
  studyCapacity: 5,
  onboarded: false,
};

export function createSeedState(): AppState {
  const chapters: Chapter[] = JEE_CHAPTERS.map((c, i) => ({
    ...c,
    id: `ch_${i}`,
  }));

  const totalXp = 7420 + 8000 * 16; // level 17 worth of XP

  return {
    profile: DEFAULT_PROFILE,
    baseSchedule: [],
    exceptions: [],
    tasks: [],
    sessions: [],
    chapters,
    pyqs: SEED_PYQS,
    mocks: SEED_MOCKS,
    errors: SEED_ERRORS,
    achievements: SEED_ACHIEVEMENTS,
    revisions: SEED_REVISIONS,
    chat: [],
    changes: [],
    dayLogs: SEED_DAY_LOGS,
    stats: { ...DEFAULT_STATS, totalXp },
    currentEnergy: 'normal',
  };
}

export function createOnboardedState(name: string, schedule: TimeBlock[]): AppState {
  const seed = createSeedState();
  return {
    ...seed,
    profile: {
      ...seed.profile,
      name,
      onboarded: true,
    },
    baseSchedule: schedule,
  };
}
