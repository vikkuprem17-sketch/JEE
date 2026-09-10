import type { Task, TimeBlock, Chapter, ScheduleException, EnergyLevel, SubjectId } from '@/types';
import { computeStudyWindows, formatTime } from './scheduleParser';

export function getDateStr(date: Date = new Date()): string {
  return date.toISOString().split('T')[0];
}

export function getBlocksForDate(baseSchedule: TimeBlock[], exceptions: ScheduleException[], date: Date): TimeBlock[] {
  const dateStr = getDateStr(date);
  const dayIndex = date.getDay();

  // Check for exceptions on this date
  const dayException = exceptions.find((e) => e.date === dateStr);
  if (dayException) {
    return dayException.blocks;
  }

  // Filter base schedule for this day
  return baseSchedule.filter((b) => !b.days || b.days.includes(dayIndex));
}

export function getStudyWindowsForDate(
  baseSchedule: TimeBlock[],
  exceptions: ScheduleException[],
  date: Date
): TimeBlock[] {
  const blocks = getBlocksForDate(baseSchedule, exceptions, date);
  return computeStudyWindows(blocks, date.getDay());
}

export function getTotalStudyMinutes(windows: TimeBlock[]): number {
  return windows.reduce((sum, w) => sum + (w.end - w.start), 0);
}

const SUBJECTS: SubjectId[] = ['physics', 'chemistry', 'mathematics'];

interface TaskTemplate {
  subject: SubjectId;
  chapter: string;
  title: string;
  type: Task['type'];
  missionType: Task['missionType'];
  duration: number;
  priority: number;
  xpReward: number;
  pyqCount?: number;
}

export function generateDailyTasks(
  chapters: Chapter[],
  windows: TimeBlock[],
  energy: EnergyLevel,
  date: string,
  existingTasks: Task[]
): Task[] {
  const tasks: Task[] = [];
  const totalMinutes = getTotalStudyMinutes(windows);

  // Energy factor
  const energyFactor = energy === 'high' ? 1.0 : energy === 'normal' ? 0.85 : energy === 'low' ? 0.6 : 0.4;
  const effectiveMinutes = Math.floor(totalMinutes * energyFactor);

  // Don't fill every minute — leave 15% breathing room
  const targetMinutes = Math.floor(effectiveMinutes * 0.85);

  // Sort chapters by weakness + revision status
  const sortedChapters = [...chapters].sort((a, b) => {
    const aScore = (100 - a.conceptMastery) + (a.revisionStatus === 'overdue' ? 50 : a.revisionStatus === 'due' ? 30 : a.revisionStatus === 'due_soon' ? 15 : 0) + (a.isWeak ? 20 : 0);
    const bScore = (100 - b.conceptMastery) + (b.revisionStatus === 'overdue' ? 50 : b.revisionStatus === 'due' ? 30 : b.revisionStatus === 'due_soon' ? 15 : 0) + (b.isWeak ? 20 : 0);
    return bScore - aScore;
  });

  // Build task templates based on chapters
  const templates: TaskTemplate[] = [];

  // Main quest: weakest chapter deep study
  const weakest = sortedChapters[0];
  if (weakest) {
    templates.push({
      subject: weakest.subject,
      chapter: weakest.name,
      title: `${weakest.name} — Deep Study`,
      type: 'study',
      missionType: 'main',
      duration: energy === 'low' || energy === 'dead' ? 45 : 90,
      priority: 9,
      xpReward: 100,
    });
  }

  // Side quest: PYQs from second weakest
  const secondWeakest = sortedChapters[1];
  if (secondWeakest) {
    templates.push({
      subject: secondWeakest.subject,
      chapter: secondWeakest.name,
      title: `${secondWeakest.name} — 25 PYQs`,
      type: 'pyq',
      missionType: 'side',
      duration: 45,
      priority: 7,
      xpReward: 75,
      pyqCount: 25,
    });
  }

  // Memory quest: revision of due chapter
  const dueChapter = chapters.find((c) => c.revisionStatus === 'due' || c.revisionStatus === 'overdue');
  if (dueChapter) {
    templates.push({
      subject: dueChapter.subject,
      chapter: dueChapter.name,
      title: `${dueChapter.name} — Revision`,
      type: 'revision',
      missionType: 'memory',
      duration: 30,
      priority: 8,
      xpReward: 50,
    });
  } else {
    // Fallback: revision of a mid-chapter
    const midChapter = sortedChapters[Math.floor(sortedChapters.length / 2)];
    if (midChapter) {
      templates.push({
        subject: midChapter.subject,
        chapter: midChapter.name,
        title: `${midChapter.name} — Formula Review`,
        type: 'revision',
        missionType: 'memory',
        duration: 30,
        priority: 5,
        xpReward: 50,
      });
    }
  }

  // Boss quest: mixed timed set (only if enough time)
  if (targetMinutes >= 180) {
    const bossChapter = sortedChapters[2] || sortedChapters[0];
    if (bossChapter) {
      templates.push({
        subject: bossChapter.subject,
        chapter: bossChapter.name,
        title: `Timed Mixed Set — ${bossChapter.name}`,
        type: 'pyq',
        missionType: 'boss',
        duration: 45,
        priority: 6,
        xpReward: 150,
        pyqCount: 20,
      });
    }
  }

  // Low energy: replace study with revision/easier tasks
  if (energy === 'low' || energy === 'dead') {
    templates.forEach((t) => {
      if (t.type === 'study') {
        t.type = 'revision';
        t.title = t.title.replace('Deep Study', 'Active Recall');
        t.duration = Math.min(t.duration, 30);
      }
      if (t.missionType === 'boss') {
        t.duration = 20;
      }
    });
  }

  // Assign tasks to study windows
  let windowIdx = 0;
  let usedMinutes = 0;

  for (const template of templates) {
    if (usedMinutes + template.duration > targetMinutes && tasks.length > 0) {
      // Try to fragment
      const remaining = targetMinutes - usedMinutes;
      if (remaining >= 20) {
        const fragmentDuration = Math.min(remaining, template.duration);
        tasks.push(createTask(template, date, fragmentDuration, windows[windowIdx]?.start));
        usedMinutes += fragmentDuration;
        // Schedule remainder for tomorrow
      }
      continue;
    }

    const window = windows[windowIdx];
    if (!window) break;

    const startTime = window.start;
    tasks.push(createTask(template, date, template.duration, startTime));
    usedMinutes += template.duration;

    // Move to next window if current is full
    const windowRemaining = window.end - window.start;
    if (usedMinutes >= windowRemaining) {
      windowIdx++;
      usedMinutes = 0;
    }
  }

  return tasks;
}

function createTask(
  template: TaskTemplate,
  date: string,
  duration: number,
  startTime?: number
): Task {
  return {
    id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    subject: template.subject,
    chapter: template.chapter,
    title: template.title,
    type: template.type,
    missionType: template.missionType,
    duration,
    priority: template.priority,
    status: 'pending',
    date,
    startTime,
    estimatedDuration: duration,
    xpReward: template.xpReward,
    pyqCount: template.pyqCount,
  };
}

export function rescheduleTasks(
  tasks: Task[],
  availableMinutes: number,
  energy: EnergyLevel,
  date: string
): Task[] {
  const pending = tasks.filter((t) => t.status === 'pending' || t.status === 'in_progress');
  const completed = tasks.filter((t) => t.status === 'completed' || t.status === 'skipped' || t.status === 'missed');

  // Sort by priority (highest first)
  pending.sort((a, b) => b.priority - a.priority);

  const energyFactor = energy === 'high' ? 1.0 : energy === 'normal' ? 0.85 : energy === 'low' ? 0.6 : 0.4;
  const effectiveMinutes = Math.floor(availableMinutes * energyFactor * 0.85);

  let usedMinutes = 0;
  const result: Task[] = [...completed];

  for (const task of pending) {
    if (usedMinutes + task.duration <= effectiveMinutes) {
      result.push(task);
      usedMinutes += task.duration;
    } else {
      // Try to fragment
      const remaining = effectiveMinutes - usedMinutes;
      if (remaining >= 20) {
        const fragmented: Task = {
          ...task,
          id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          duration: remaining,
          title: `${task.title} (partial)`,
        };
        result.push(fragmented);
        usedMinutes += remaining;
      }
      // Skip the rest (move to tomorrow conceptually)
    }
  }

  return result;
}

export function getMascotStage(level: number): string {
  if (level >= 75) return 'ASCENDED';
  if (level >= 50) return 'JEE Beast';
  if (level >= 30) return 'Elite';
  if (level >= 20) return 'Scholar';
  if (level >= 10) return 'Grinder';
  return 'Rookie';
}

export function xpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.15, level - 1));
}

export function getLevelFromXp(totalXp: number): { level: number; xp: number; xpToNext: number } {
  let level = 1;
  let remaining = totalXp;
  while (remaining >= xpForLevel(level)) {
    remaining -= xpForLevel(level);
    level++;
  }
  return {
    level,
    xp: remaining,
    xpToNext: xpForLevel(level),
  };
}

export function getConsistencyTier(score: number): string {
  if (score >= 90) return 'ASCENDED';
  if (score >= 75) return 'ELITE';
  if (score >= 60) return 'STRONG';
  if (score >= 40) return 'BUILDING';
  return 'RISING';
}
