import { dayKey, dayOrdinal } from '../daily/calendar';
import { QUEST_TEMPLATES } from '../generation/templates';
import { DEFAULT_ACTIVITIES } from '../daily/templates';
import type { SystemSnapshot } from '../storage/database';
import type { AIGameMasterContext, RecentQuestSummary } from './types';

function completionRate(snapshot: SystemSnapshot) {
  const today = dayOrdinal(dayKey());
  const recent = snapshot.recentActivity.filter(item => {
    if (item.result === 'OFFERED') return false;
    const distance = today - dayOrdinal(item.day);
    return distance >= 0 && distance <= 7;
  });
  if (!recent.length) return 0;
  return recent.filter(item => item.result === 'COMPLETED').length / recent.length;
}

function systemDebt(snapshot: SystemSnapshot): 0 | 1 | 2 | 3 {
  let consecutiveFails = 0;
  for (const item of snapshot.recentActivity) {
    if (item.result === 'OFFERED') continue;
    if (item.result === 'COMPLETED') break;
    if (item.result === 'FAILED') consecutiveFails += 1;
  }
  return Math.max(snapshot.systemDebt, Math.min(3, consecutiveFails)) as 0 | 1 | 2 | 3;
}

function recentQuestSummary(snapshot: SystemSnapshot): RecentQuestSummary[] {
  return snapshot.recentActivity.slice(0, 50).map(item => {
    const template = item.templateId
      ? QUEST_TEMPLATES.find(candidate => candidate.id === item.templateId)
      : undefined;
    return {
      title: template?.titlePattern ?? item.templateId ?? item.category ?? 'SYSTEM QUEST',
      description: template?.descriptionPattern,
      category: item.category,
      difficulty: item.difficulty,
      completed: item.result === 'COMPLETED',
      failed: item.result === 'FAILED',
      createdAt: item.day + 'T12:00:00.000Z',
    };
  });
}

function goalPlanningDescription(goal: SystemSnapshot['goals'][number]) {
  const details = [
    goal.description || undefined,
    goal.target ? `Docelowy rezultat: ${goal.target}` : undefined,
    goal.targetDate ? `Termin: ${goal.targetDate}` : undefined,
    `Priorytet: ${goal.priority}/3`,
  ].filter(Boolean);
  return details.join(' · ');
}

/**
 * Minimal AI payload. Deliberately excludes displayName, birthDate, avatar URI,
 * local player id, XP balances, reward balances, precise position and raw evidence.
 */
export function buildAIGameMasterContext(snapshot: SystemSnapshot): AIGameMasterContext {
  const resolved = Intl.DateTimeFormat().resolvedOptions();
  return {
    player: {
      level: snapshot.player.realLevel,
      rank: snapshot.player.rank,
      streak: snapshot.player.streak,
      completionRate7d: completionRate(snapshot),
      systemDebt: systemDebt(snapshot),
      activities: snapshot.settings.activities ?? DEFAULT_ACTIVITIES,
      locale: resolved.locale || 'pl-PL',
      timezone: resolved.timeZone || 'Europe/Warsaw',
    },
    goals: snapshot.goals
      .filter(goal => goal.status === 'ACTIVE')
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 10)
      .map((goal, index) => ({
        id: 'goal-' + (index + 1),
        title: goal.title,
        description: goalPlanningDescription(goal),
      })),
    recentQuests: recentQuestSummary(snapshot),
    nowIso: new Date().toISOString(),
  };
}
