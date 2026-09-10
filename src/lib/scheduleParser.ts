import type { TimeBlock } from '@/types';

const DAY_MAP: Record<string, number> = {
  sun: 0, sunday: 0, sundays: 0,
  mon: 1, monday: 1, mondays: 1,
  tue: 2, tues: 2, tuesday: 2, tuesdays: 2,
  wed: 3, wednesday: 3, wednesdays: 3,
  thu: 4, thur: 4, thurs: 4, thursday: 4, thursdays: 4,
  fri: 5, friday: 5, fridays: 5,
  sat: 6, saturday: 6, saturdays: 6,
};

const ACTIVITY_KEYWORDS: Record<string, string> = {
  school: 'school',
  coaching: 'coaching',
  tuition: 'coaching',
  class: 'coaching',
  classes: 'coaching',
  travel: 'travel',
  commute: 'travel',
  bus: 'travel',
  meal: 'meal',
  lunch: 'meal',
  dinner: 'meal',
  breakfast: 'meal',
  eat: 'meal',
  sleep: 'sleep',
  nap: 'sleep',
  study: 'study',
  homework: 'study',
  hw: 'study',
  break: 'break',
  rest: 'break',
  exercise: 'exercise',
  gym: 'exercise',
  workout: 'exercise',
  free: 'free',
  chill: 'free',
  relax: 'free',
  dinner: 'meal',
};

function parseTime(str: string): number | null {
  str = str.toLowerCase().trim();
  if (!str) return null;

  // 12-hour format: 8pm, 8 pm, 8:30pm, 8:30 pm, 8.30pm
  const ampmMatch = str.match(/^(\d{1,2})[:.](\d{2})?\s*(am|pm|a\.m\.|p\.m\.)?$/);
  if (ampmMatch) {
    let h = parseInt(ampmMatch[1]);
    const m = ampmMatch[2] ? parseInt(ampmMatch[2]) : 0;
    const period = ampmMatch[3]?.replace(/\./g, '');
    if (period === 'pm' && h !== 12) h += 12;
    if (period === 'am' && h === 12) h = 0;
    if (h < 0 || h > 23) return null;
    return h * 60 + m;
  }

  // 24-hour format: 14:30, 08:00
  const h24Match = str.match(/^(\d{1,2}):(\d{2})$/);
  if (h24Match) {
    const h = parseInt(h24Match[1]);
    const m = parseInt(h24Match[2]);
    if (h > 23 || m > 59) return null;
    return h * 60 + m;
  }

  // Plain number like "8" — ambiguous, return null for safety
  const plainNum = str.match(/^(\d{1,2})$/);
  if (plainNum) {
    return null;
  }

  return null;
}

function inferPeriod(text: string, timeStr: string): 'am' | 'pm' | null {
  const lower = text.toLowerCase();
  // Check if am/pm is already in the time string
  if (/am|a\.m\./.test(timeStr)) return 'am';
  if (/pm|p\.m\./.test(timeStr)) return 'pm';

  // Context-based inference
  // School usually starts in morning (8am)
  // Coaching usually evening (after 4pm)
  // Dinner is pm
  // Lunch is pm (afternoon)
  // Study after dinner is pm
  // Wake up is am

  const nearbyText = lower;
  if (/school/.test(nearbyText) && !/end|finish|over/.test(nearbyText)) {
    if (parseInt(timeStr) >= 7 && parseInt(timeStr) <= 11) return 'am';
  }
  if (/coaching|tuition|class/.test(nearbyText)) {
    if (parseInt(timeStr) >= 4 && parseInt(timeStr) <= 11) return 'pm';
  }
  if (/dinner/.test(nearbyText)) return 'pm';
  if (/lunch/.test(nearbyText)) return 'pm';
  if (/wake|wakeup|wake up|get up/.test(nearbyText)) return 'am';
  if (/sleep|bed/.test(nearbyText)) return 'pm';
  if (/reach home|come home|back home|back/.test(nearbyText)) return 'pm';
  if (/study/.test(nearbyText)) {
    // study after school is pm
    if (parseInt(timeStr) <= 12 && parseInt(timeStr) >= 8) return 'pm';
  }

  // Heuristic: 1-6 likely pm, 7-12 likely am for activities
  const h = parseInt(timeStr);
  if (h >= 1 && h <= 6) return 'pm';
  if (h >= 7 && h <= 11) return 'am';

  return null;
}

function resolveTime(rawTime: string, fullText: string): number | null {
  rawTime = rawTime.toLowerCase().trim();
  // Handle "ish" suffix: "3:45ish", "4ish"
  const ishMatch = rawTime.match(/^(\d{1,2}(?:[:.]\d{2})?)\s*ish$/);
  if (ishMatch) {
    rawTime = ishMatch[1];
  }
  // Handle "around", "about", "probably", "usually" prefixes — already stripped by caller
  const direct = parseTime(rawTime);
  if (direct !== null) return direct;

  // Try to infer am/pm
  const numMatch = rawTime.match(/^(\d{1,2})([:.](\d{2}))?$/);
  if (numMatch) {
    const period = inferPeriod(fullText, numMatch[1]);
    if (period) {
      let h = parseInt(numMatch[1]);
      const m = numMatch[3] ? parseInt(numMatch[3]) : 0;
      if (period === 'pm' && h !== 12) h += 12;
      if (period === 'am' && h === 12) h = 0;
      return h * 60 + m;
    }
  }

  return null;
}

interface RawActivity {
  keyword: string;
  days: number[];
  startTime: number | null;
  endTime: number | null;
  rawText: string;
}

function extractDays(segment: string): number[] {
  const days = new Set<number>();
  const lower = segment.toLowerCase();

  // "monday wednesday friday", "mon wed fri", "mon/wed/fri"
  const dayPattern = /\b(sun(?:day)?|mon(?:day)?|tue(?:s(?:day)?)?|wed(?:nesday)?|thu(?:r(?:s(?:day)?)?)?|fri(?:day)?|sat(?:urday)?)s?\b/g;
  let match;
  while ((match = dayPattern.exec(lower)) !== null) {
    const day = DAY_MAP[match[1].toLowerCase()];
    if (day !== undefined) days.add(day);
  }

  // "weekdays" = Mon-Fri
  if (/week\s*days/.test(lower)) {
    [1, 2, 3, 4, 5].forEach((d) => days.add(d));
  }
  // "weekends" = Sat-Sun
  if (/week\s*ends/.test(lower)) {
    [0, 6].forEach((d) => days.add(d));
  }
  // "everyday" / "daily" = all days
  if (/\bevery\s*day\b|\bdaily\b/.test(lower)) {
    [0, 1, 2, 3, 4, 5, 6].forEach((d) => days.add(d));
  }

  return Array.from(days).sort();
}

function extractTimeRange(segment: string, fullText: string): { start: number | null; end: number | null } {
  const lower = segment.toLowerCase();

  // Pattern: "8 to 3", "8-3", "8:30 to 3:45", "6-8pm", "8 to 3pm"
  // Also: "8am to 3pm", "from 6 to 8"
  const rangePatterns = [
    // "X to Y" or "X-Y" with optional am/pm
    /(?:from\s+)?(\d{1,2}(?:[:.]\d{2})?\s*(?:am|pm|a\.m\.|p\.m\.)?)\s*(?:to|until|till|til|-|–|—)\s*(\d{1,2}(?:[:.]\d{2})?\s*(?:am|pm|a\.m\.|p\.m\.)?)/,
    // "Xish to Yish"
    /(\d{1,2}(?:[:.]\d{2})?ish)\s*(?:to|until|till|til|-|–|—)\s*(\d{1,2}(?:[:.]\d{2})?ish)/,
  ];

  for (const pattern of rangePatterns) {
    const match = lower.match(pattern);
    if (match) {
      let startStr = match[1].replace(/\s+/g, '');
      let endStr = match[2].replace(/\s+/g, '');

      // If start has no am/pm but end does, inherit
      const endHasPeriod = /am|pm|a\.m\.|p\.m\./.test(endStr);
      const startHasPeriod = /am|pm|a\.m\.|p\.m\./.test(startStr);

      if (endHasPeriod && !startHasPeriod) {
        // Extract period from end
        const periodMatch = endStr.match(/(am|pm|a\.m\.|p\.m\.)/);
        if (periodMatch) {
          const period = periodMatch[1].replace(/\./g, '');
          const endHour = parseInt(endStr);
          // If end is pm and start hour > end hour, start is am
          if (period === 'pm' && parseInt(startStr) > endHour) {
            startStr = startStr + 'am';
          } else {
            startStr = startStr + period;
          }
        }
      }

      const start = resolveTime(startStr, fullText);
      const end = resolveTime(endStr, fullText);

      if (start !== null && end !== null) {
        // Handle overnight: if end < start, add 24h to end
        let adjustedEnd = end;
        if (end < start) {
          adjustedEnd = end + 24 * 60;
        }
        return { start, end: adjustedEnd };
      }
    }
  }

  // Single time point: "at 5", "around 3:45", "by 4"
  const singleTimeMatch = lower.match(/(?:at|around|by|about|probably|usually|~)\s*(\d{1,2}(?:[:.]\d{2})?(?:ish)?\s*(?:am|pm|a\.m\.|p\.m\.)?)/);
  if (singleTimeMatch) {
    const t = resolveTime(singleTimeMatch[1], fullText);
    if (t !== null) return { start: t, end: null };
  }

  // Bare time: "3:45" or "3ish"
  const bareTimeMatch = lower.match(/\b(\d{1,2}(?:[:.]\d{2})?ish?)\s*(?:am|pm|a\.m\.|p\.m\.)?\b/);
  if (bareTimeMatch) {
    const t = resolveTime(bareTimeMatch[1], fullText);
    if (t !== null) return { start: t, end: null };
  }

  return { start: null, end: null };
}

function identifyActivity(segment: string): string | null {
  const lower = segment.toLowerCase();
  for (const [keyword, activity] of Object.entries(ACTIVITY_KEYWORDS)) {
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    if (regex.test(lower)) {
      return activity;
    }
  }
  return null;
}

export interface ParsedScheduleResult {
  blocks: TimeBlock[];
  understood: { label: string; time: string; days: string }[];
  studyWindows: TimeBlock[];
  warnings: string[];
}

export function parseSchedule(input: string): ParsedScheduleResult {
  const blocks: TimeBlock[] = [];
  const warnings: string[] = [];
  const understood: { label: string; time: string; days: string }[] = [];

  // Normalize input
  const text = input.replace(/\s+/g, ' ').trim().toLowerCase();

  // Split into segments by commas, semicolons, "then", periods
  const segments = text
    .split(/[,;.]|\bthen\b|\bafter that\b|\band\b/)
    .map((s) => s.trim())
    .filter((s) => s.length > 2);

  const processedActivities: RawActivity[] = [];

  for (const segment of segments) {
    const activity = identifyActivity(segment);
    if (!activity) continue;

    const days = extractDays(segment);
    const { start, end } = extractTimeRange(segment, input);

    if (start === null && end === null) {
      warnings.push(`Couldn't figure out the time for "${segment.trim()}"`);
      continue;
    }

    processedActivities.push({
      keyword: activity,
      days,
      startTime: start,
      endTime: end,
      rawText: segment.trim(),
    });
  }

  // Merge consecutive segments with same activity (e.g., "school is 8 to 3" + "reach home around 3:45")
  // Actually each segment is a distinct activity, keep them separate

  // Build time blocks
  for (const act of processedActivities) {
    const days = act.days.length > 0 ? act.days : undefined;
    let label = act.keyword.charAt(0).toUpperCase() + act.keyword.slice(1);

    // Better labels
    if (act.keyword === 'school') label = 'School';
    if (act.keyword === 'coaching') label = 'Coaching';
    if (act.keyword === 'travel') label = 'Travel';
    if (act.keyword === 'meal') {
      if (/lunch/.test(act.rawText)) label = 'Lunch';
      else if (/dinner/.test(act.rawText)) label = 'Dinner';
      else if (/breakfast/.test(act.rawText)) label = 'Breakfast';
      else label = 'Meal';
    }
    if (act.keyword === 'sleep') label = 'Sleep';
    if (act.keyword === 'study') label = 'Study';
    if (act.keyword === 'exercise') label = 'Exercise';
    if (act.keyword === 'break') label = 'Break';
    if (act.keyword === 'free') label = 'Free time';

    let start = act.startTime;
    let end = act.endTime;

    // If only start time, estimate duration
    if (start !== null && end === null) {
      if (act.keyword === 'meal') end = start + 30;
      else if (act.keyword === 'travel') end = start + 45;
      else if (act.keyword === 'break') end = start + 15;
      else if (act.keyword === 'free') end = start + 60;
      else if (act.keyword === 'exercise') end = start + 45;
      else end = start + 60;
    }

    if (start !== null && end !== null) {
      const block: TimeBlock = {
        start,
        end,
        label,
        type: act.keyword as TimeBlock['type'],
        days,
      };
      blocks.push(block);

      const dayStr = days ? days.map((d) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]).join('/') : 'Daily';
      understood.push({
        label,
        time: `${formatTime(start)} → ${formatTime(end)}`,
        days: dayStr,
      });
    }
  }

  // Add default sleep block if not mentioned
  const hasSleep = blocks.some((b) => b.type === 'sleep');
  if (!hasSleep) {
    blocks.push({
      start: 0,
      end: 6 * 60 + 30, // 12:00 AM to 6:30 AM
      label: 'Sleep',
      type: 'sleep',
    });
    understood.push({ label: 'Sleep', time: '12:00 AM → 6:30 AM', days: 'Daily (assumed)' });
  }

  // Sort blocks by start time
  blocks.sort((a, b) => a.start - b.start);

  // Calculate study windows for a default day (day index 1 = Monday)
  const studyWindows = computeStudyWindows(blocks, 1);

  return {
    blocks,
    understood,
    studyWindows,
    warnings,
  };
}

export function computeStudyWindows(blocks: TimeBlock[], dayIndex: number): TimeBlock[] {
  // Get blocks active on this day
  const dayBlocks = blocks.filter((b) => !b.days || b.days.includes(dayIndex));
  if (dayBlocks.length === 0) return [];

  // Sort by start
  dayBlocks.sort((a, b) => a.start - b.start);

  const windows: TimeBlock[] = [];
  let cursor = 0; // start of day (midnight)

  // Handle sleep at start of day
  const sleepBlock = dayBlocks.find((b) => b.type === 'sleep' && b.start < 360);
  if (sleepBlock) {
    cursor = sleepBlock.end;
  }

  for (const block of dayBlocks) {
    if (block.type === 'sleep' && block.start < 360) continue; // already handled
    if (block.start > cursor) {
      // Gap = potential study window
      const gapDuration = block.start - cursor;
      if (gapDuration >= 20) {
        windows.push({
          start: cursor,
          end: block.start,
          label: 'Study window',
          type: 'study',
          isStudyWindow: true,
        });
      }
    }
    cursor = Math.max(cursor, block.end);
  }

  // After last block until midnight
  if (cursor < 24 * 60) {
    const remaining = 24 * 60 - cursor;
    if (remaining >= 20) {
      windows.push({
        start: cursor,
        end: 24 * 60,
        label: 'Study window',
        type: 'study',
        isStudyWindow: true,
      });
    }
  }

  return windows;
}

export function formatTime(minutes: number): string {
  const m = ((minutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const h = Math.floor(m / 60);
  const min = m % 60;
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${displayH}:${min.toString().padStart(2, '0')} ${period}`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}
