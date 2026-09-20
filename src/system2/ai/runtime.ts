import { getValidSession } from '../cloud/auth';
import { cloudRequest } from '../cloud/http';
import { dayKey, dayOrdinal } from '../daily/calendar';
import { QUEST_TEMPLATES } from '../generation/templates';
import type { SystemSnapshot } from '../storage/database';
import { buildFallback } from './fallback';
import type { AIGameMasterContext, AIGameMasterResponse, RecentQuestSummary } from './types';
import { validateAIGameMasterResponse } from './validate';

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

export function buildAIGameMasterContext(snapshot: SystemSnapshot): AIGameMasterContext {
  const resolved = Intl.DateTimeFormat().resolvedOptions();
  return {
    player: {
      level: snapshot.player.realLevel,
      rank: snapshot.player.rank,
      streak: snapshot.player.streak,
      completionRate7d: completionRate(snapshot),
      systemDebt: systemDebt(snapshot),
      locale: resolved.locale || 'pl-PL',
      timezone: resolved.timeZone || 'Europe/Warsaw',
    },
    goals: snapshot.goals
      .filter(goal => goal.status === 'ACTIVE')
      .slice(0, 10)
      .map(goal => ({
        id: goal.id,
        title: goal.title,
        description: goal.description || undefined,
      })),
    recentQuests: recentQuestSummary(snapshot),
    nowIso: new Date().toISOString(),
  };
}

async function requestContextAIGameMaster(
  context: AIGameMasterContext,
): Promise<AIGameMasterResponse> {
  const session = await getValidSession();
  if (!session) return buildFallback(context, 3);

  try {
    const payload = await cloudRequest<unknown>(
      '/functions/v1/ai-game-master',
      {
        method: 'POST',
        body: JSON.stringify({ action: 'generate_daily', context }),
      },
      session.accessToken,
    );
    const validated = validateAIGameMasterResponse(
      payload,
      context.recentQuests.map(quest => quest.title),
    );
    return validated ?? buildFallback(context, 3);
  } catch {
    return buildFallback(context, 3);
  }
}

export function requestDailyAIGameMaster(
  snapshot: SystemSnapshot,
): Promise<AIGameMasterResponse> {
  return requestContextAIGameMaster(buildAIGameMasterContext(snapshot));
}

export async function requestGoalAIGameMaster(
  snapshot: SystemSnapshot,
  rawGoal: string,
): Promise<AIGameMasterResponse> {
  const goal = rawGoal.trim().replace(/\s+/g, ' ');
  if (goal.length < 5 || goal.length > 200) {
    throw new Error('Cel powinien mieć od 5 do 200 znaków.');
  }
  const context = buildAIGameMasterContext(snapshot);
  context.goals = [
    {
      id: 'game-master-preview',
      title: goal,
      description: 'Cel wpisany przez gracza do podglądu kampanii.',
    },
    ...context.goals,
  ].slice(0, 10);
  return requestContextAIGameMaster(context);
}
