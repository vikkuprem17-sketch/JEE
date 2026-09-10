import type { AppState, ChatMessage, EnergyLevel, Task, ScheduleException, TimeBlock } from '@/types';
import { getDateStr } from './scheduleEngine';
import { formatTime, formatDuration } from './scheduleParser';

interface IntentResult {
  intent: string;
  response: string;
  action?: ChatMessage['action'];
  data?: Record<string, unknown>;
}

const CASUAL_RESPONSES = {
  greeting: [
    "Yo! What's the move? You here to lock in or just vibing?",
    "Hey! Ready to ascend or what?",
    "What's good? Talk to me.",
  ],
  encouragement: [
    "Let's gooo. You've got this.",
    "That's the spirit. Let's make it count.",
    "Bro, the grind starts now.",
  ],
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function processMessage(
  message: string,
  state: AppState
): IntentResult {
  const msg = message.toLowerCase().trim();
  const now = new Date();
  const dateStr = getDateStr(now);
  const currentTime = now.getHours() * 60 + now.getMinutes();

  // === WHAT AM I DOING / TODAY ===
  if (/\b(what.*do|what.*today|what.*now|what.*next|what's.*plan|plan.*today)\b/.test(msg)) {
    const todayTasks = state.tasks.filter((t) => t.date === dateStr && t.status === 'pending');
    const completed = state.tasks.filter((t) => t.date === dateStr && t.status === 'completed');
    const totalPlanned = state.tasks.filter((t) => t.date === dateStr);
    const completedMinutes = completed.reduce((s, t) => s + t.duration, 0);
    const plannedMinutes = totalPlanned.reduce((s, t) => s + t.duration, 0);

    if (todayTasks.length === 0) {
      return {
        intent: 'query_plan',
        response: `You're all caught up for today! ${completedMinutes > 0 ? `You already knocked out ${formatDuration(completedMinutes)} of study time. `}Want me to plan something extra, or are you done for the day?`,
        action: 'none',
      };
    }

    const nextTask = todayTasks[0];
    const subjectCap = nextTask.subject.charAt(0).toUpperCase() + nextTask.subject.slice(1);
    const remaining = plannedMinutes - completedMinutes;

    return {
      intent: 'query_plan',
      response: `Here's where you're at: ${formatDuration(completedMinutes)} done out of ${formatDuration(plannedMinutes)} planned. Your next mission is **${subjectCap} — ${nextTask.title}** (${formatDuration(nextTask.duration)}). ${remaining > 0 ? `You've got ${formatDuration(remaining)} of study left today.` : ''} Ready to lock in?`,
      action: 'none',
    };
  }

  // === TIRED / LOW ENERGY ===
  if (/\b(tired|exhausted|dead|done|burnt|burned out|no energy|can't|cant|sleepy|exhausted|finished|wasted|drained)\b/.test(msg)) {
    const energy: EnergyLevel = /\b(dead|finished|done|wasted)\b/.test(msg) ? 'dead' : 'low';
    const windows = state.baseSchedule;
    return {
      intent: 'low_energy',
      response: `I hear you. No guilt trips here. I'm switching tonight to lighter tasks — formula review, active recall, maybe some easy PYQs. No brutal deep-study sessions. You can still make progress without destroying yourself. Want me to rebuild the plan?`,
      action: 'update_energy',
      data: { energy },
    };
  }

  // === GOING OUT / BUSY / CANCELLED ===
  if (/\b(going out|going to|heading out|leaving|gotta go|friend|cousin|family|function|party|outing|movie|hang|hangout|hang out)\b/.test(msg) ||
      /\b(cancel|cancelled|canceled)\b/.test(msg) ||
      /\b(stuck|busy|can't study|cant study|won't study|wont study)\b/.test(msg)) {

    // Try to extract time
    const timeMatch = msg.match(/(\d{1,2}(?:[:.]\d{2})?\s*(?:am|pm|a\.m\.|p\.m\.)?)\s*(?:to|till|until|-|–)?\s*(\d{1,2}(?:[:.]\d{2})?\s*(?:am|pm|a\.m\.|p\.m\.)?)?/);
    let blockedStart = currentTime;
    let blockedEnd = currentTime + 120; // default 2 hours

    if (timeMatch) {
      const start = parseTimeLoose(timeMatch[1], msg);
      const end = timeMatch[2] ? parseTimeLoose(timeMatch[2], msg) : null;
      if (start !== null) blockedStart = start;
      if (end !== null) blockedEnd = end;
      else blockedEnd = blockedStart + 180; // default 3 hours
    }

    const blockedDuration = blockedEnd - blockedStart;
    const pendingTasks = state.tasks.filter((t) => t.date === dateStr && t.status === 'pending');
    const totalPending = pendingTasks.reduce((s, t) => s + t.duration, 0);

    return {
      intent: 'block_time',
      response: `Got you. I'm blocking ${formatTime(blockedStart)}–${formatTime(blockedEnd)} (${formatDuration(blockedDuration)}). ${totalPending > 0 ? `You had ${formatDuration(totalPending)} of study planned. I'm cutting the low-priority stuff and keeping what matters. ` : ''}Rebuilding now — here's your updated plan.`,
      action: 'reschedule',
      data: { blockedStart, blockedEnd, reason: message },
    };
  }

  // === EXTRA TIME AVAILABLE ===
  if (/\b(extra|more time|can study|got time|free now|available|2 hours|1 hour|3 hours|30 min|30 mins|45 min)\b/.test(msg)) {
    const hoursMatch = msg.match(/(\d+)\s*(?:h|hour|hr)s?/);
    const minsMatch = msg.match(/(\d+)\s*(?:m|min|mins)/);
    let extraMinutes = 0;
    if (hoursMatch) extraMinutes += parseInt(hoursMatch[1]) * 60;
    if (minsMatch) extraMinutes += parseInt(minsMatch[1]);
    if (extraMinutes === 0) extraMinutes = 60;

    return {
      intent: 'extra_time',
      response: `Nice, you've got ${formatDuration(extraMinutes)} extra. Let me slot in a high-value task. ${extraMinutes >= 60 ? 'I can fit a full study block or a PYQ set.' : 'Perfect for a quick revision or formula review.'} Rebuilding your plan now.`,
      action: 'reschedule',
      data: { extraMinutes, reason: message },
    };
  }

  // === MOVE TASK ===
  if (/\b(move|shift|postpone|tomorrow|reschedule|push)\b/.test(msg)) {
    const subjectMatch = msg.match(/(physics|chem|maths|math|calculus|algebra|organic|inorganic|physical)/);
    const subject = subjectMatch ? subjectMatch[1] : null;
    return {
      intent: 'move_task',
      response: `Done. I've moved ${subject ? subjectMatch![1] : 'that task'} to tomorrow and reprioritized tonight. The important stuff stays — I just shuffled the order.`,
      action: 'reschedule',
      data: { moveSubject: subject, reason: message },
    };
  }

  // === REMOVE TASK ===
  if (/\b(remove|skip|drop|don't do|dont do|not doing)\b/.test(msg)) {
    const subjectMatch = msg.match(/(physics|chem|maths|math|calculus|algebra|organic|inorganic|physical)/);
    return {
      intent: 'remove_task',
      response: `Got it. Removed ${subjectMatch ? subjectMatch[1] : 'that task'} from today. No worries — I've rebalanced the rest.`,
      action: 'reschedule',
      data: { removeSubject: subjectMatch, reason: message },
    };
  }

  // === TEST / EXAM ===
  if (/\b(test|exam|mock|paper)\b/.test(msg)) {
    const tomorrowMatch = /\b(tomorrow|tmr|tmrw|2 days|day after)\b/.test(msg);
    return {
      intent: 'test_alert',
      response: `Noted — you've got a ${tomorrowMatch ? 'test tomorrow' : 'test coming up'}. I'm prioritizing the most likely test topics and scheduling a quick revision tonight. ${tomorrowMatch ? 'Make sure you sleep well — cramming all night will hurt more than help.' : ''}`,
      action: 'reschedule',
      data: { testAlert: true, tomorrow: tomorrowMatch, reason: message },
    };
  }

  // === LOCK IN / FOCUS ===
  if (/\b(lock in|lockin|focus|grind|study|let's go|lets go|ready)\b/.test(msg)) {
    const nextTask = state.tasks.find((t) => t.date === dateStr && t.status === 'pending');
    if (nextTask) {
      const subjectCap = nextTask.subject.charAt(0).toUpperCase() + nextTask.subject.slice(1);
      return {
        intent: 'lock_in',
        response: `That's what I like to hear. Your mission: **${subjectCap} — ${nextTask.title}** (${formatDuration(nextTask.duration)}). Hit START and let's go.`,
        action: 'none',
        data: { taskId: nextTask.id },
      };
    }
    return {
      intent: 'lock_in',
      response: `You're all done for today! Want me to queue up something extra?`,
      action: 'none',
    };
  }

  // === HOW AM I DOING / WEEK REVIEW ===
  if (/\b(how am i|how.*doing|how.*week|progress|review|summary|stats)\b/.test(msg)) {
    const recentLogs = state.dayLogs.slice(-7);
    const totalStudy = recentLogs.reduce((s, l) => s + l.completedMinutes, 0);
    const totalPyqs = recentLogs.reduce((s, l) => s + l.pyqsAttempted, 0);
    const avgAccuracy = recentLogs.length > 0
      ? Math.round(recentLogs.reduce((s, l) => s + (l.pyqsAttempted > 0 ? (l.pyqsCorrect / l.pyqsAttempted) * 100 : 0), 0) / recentLogs.length)
      : 0;
    const weakest = [...state.chapters].sort((a, b) => a.conceptMastery - b.conceptMastery)[0];

    return {
      intent: 'week_review',
      response: `Here's your week: ${formatDuration(totalStudy)} of study, ${totalPyqs} PYQs attempted, ${avgAccuracy}% average accuracy. ${weakest ? `Your weakest chapter is ${weakest.name} (${weakest.conceptMastery}% mastery). ` : ''}Streak: ${state.stats.streak} days. ${state.stats.streak >= 7 ? 'You're on fire.' : 'Keep building that streak.'}`,
      action: 'none',
    };
  }

  // === WHAT TO REVISE ===
  if (/\b(revise|revision|review.*what|what.*revise)\b/.test(msg)) {
    const dueRevisions = state.revisions.filter((r) => !r.completed && r.scheduledDate <= dateStr);
    if (dueRevisions.length > 0) {
      const next = dueRevisions[0];
      return {
        intent: 'revise',
        response: `Your most overdue revision is **${next.chapter}** (${next.subject}). It's been a while — 30 minutes of active recall should lock it in. Want me to add it to today's plan?`,
        action: 'none',
        data: { revisionId: next.id },
      };
    }
    return {
      intent: 'revise',
      response: `You're all caught up on revisions! Nothing overdue. Want me to schedule a proactive review of your weakest chapter?`,
      action: 'none',
    };
  }

  // === EASY / LIGHT ===
  if (/\b(easy|light|simple|something easy|give me easy|make.*light)\b/.test(msg)) {
    return {
      intent: 'easy_tasks',
      response: `Got you. I'm pulling up the lightest tasks — formula sheets, active recall, easy PYQs. No heavy problem-solving today. Rebuilding now.`,
      action: 'reschedule',
      data: { easyMode: true, reason: message },
    };
  }

  // === WASTED TIME ===
  if (/\b(wasted|waste|did nothing|nothing|didn't study|didnt study|procrastinat)\b/.test(msg)) {
    const remainingWindows = state.baseSchedule.filter((b) => b.end > currentTime);
    const remainingMinutes = remainingWindows.reduce((s, w) => s + (w.end - Math.max(w.start, currentTime)), 0);

    return {
      intent: 'wasted_time',
      response: `It happens. No guilt. ${remainingMinutes > 30 ? `You've still got ${formatDuration(remainingMinutes)} available today. I'm cutting the low-value tasks and keeping the important ones. ` : 'Today might be a wash, but tomorrow's a fresh start. '}Let's recover what we can.`,
      action: 'reschedule',
      data: { wastedTime: true, reason: message },
    };
  }

  // === SLEEP / LATE NIGHT ===
  if (/\b(sleep|bed|late night|4am|3am|2am|all night|pull.*all)\b/.test(msg)) {
    return {
      intent: 'sleep_advice',
      response: `You can push late, but that's likely to hurt tomorrow's performance. I'd rather recover the highest-value 90 minutes tonight and protect your sleep. You want to be sharp for tomorrow, not a zombie. Your call though — want me to plan a focused 90-min block?`,
      action: 'none',
    };
  }

  // === GREETING ===
  if (/\b(hi|hey|hello|yo|sup|wassup|what's up|whats up)\b/.test(msg) && msg.length < 20) {
    return {
      intent: 'greeting',
      response: pick(CASUAL_RESPONSES.greeting),
      action: 'none',
    };
  }

  // === DEFAULT: try to understand as a schedule change ===
  return {
    intent: 'unknown',
    response: `I hear you. Tell me a bit more — is this a one-time thing or a regular change? And what time are we talking about?`,
    action: 'none',
  };
}

function parseTimeLoose(str: string, context: string): number | null {
  str = str.toLowerCase().trim();
  const match = str.match(/^(\d{1,2})[:.](\d{2})?\s*(am|pm|a\.m\.|p\.m\.)?$/);
  if (!match) return null;
  let h = parseInt(match[1]);
  const m = match[2] ? parseInt(match[2]) : 0;
  const period = match[3]?.replace(/\./g, '');
  if (period === 'pm' && h !== 12) h += 12;
  if (period === 'am' && h === 12) h = 0;
  return h * 60 + m;
}

export function getMorningBriefing(state: AppState): string {
  const dateStr = getDateStr();
  const todayTasks = state.tasks.filter((t) => t.date === dateStr);
  const plannedMinutes = todayTasks.reduce((s, t) => s + t.duration, 0);
  const topPriority = todayTasks.sort((a, b) => b.priority - a.priority)[0];
  const dueRevisions = state.revisions.filter((r) => !r.completed && r.scheduledDate <= dateStr);

  const name = state.profile.name || 'aspirant';
  let briefing = `Good morning, ${name}! Today's available study capacity: ${formatDuration(plannedMinutes)}. `;

  if (topPriority) {
    const subjectCap = topPriority.subject.charAt(0).toUpperCase() + topPriority.subject.slice(1);
    briefing += `Top priority: ${subjectCap} — ${topPriority.title}. `;
  }

  if (dueRevisions.length > 0) {
    briefing += `Revision due: ${dueRevisions[0].chapter}. `;
  }

  briefing += `Let's make today count. Your missions are ready.`;

  return briefing;
}

export function getEndOfDayPrompt(state: AppState): string {
  const dateStr = getDateStr();
  const todayTasks = state.tasks.filter((t) => t.date === dateStr);
  const completed = todayTasks.filter((t) => t.status === 'completed');
  const plannedMinutes = todayTasks.reduce((s, t) => s + t.duration, 0);
  const completedMinutes = completed.reduce((s, t) => s + t.duration, 0);

  const completionRate = plannedMinutes > 0 ? Math.round((completedMinutes / plannedMinutes) * 100) : 0;

  return `Quick check-in. You completed ${formatDuration(completedMinutes)} out of ${formatDuration(plannedMinutes)} today (${completionRate}%). How was your energy? Any unexpected changes? I'll reschedule whatever's left and prep tomorrow.`;
}
