import { getValidSession } from '../cloud/auth';
import { cloudRequest } from '../cloud/http';
import type { SystemSnapshot } from '../storage/database';
import { allowedDifficulties, difficultyBias } from './difficulty';
import { buildFallback } from './fallback';
import { buildAIGameMasterContext } from './context';
import type { AIGameMasterContext, AIGameMasterResponse } from './types';
import { validateAIGameMasterResponse } from './validate';

async function requestContextAIGameMaster(
  context: AIGameMasterContext,
): Promise<AIGameMasterResponse> {
  const session = await getValidSession();
  if (!session) return buildFallback(context, 3);

  try {
    const payload = await cloudRequest<unknown>(
      '/functions/v1/ai-game-master',
      { method: 'POST', body: JSON.stringify({ action: 'generate_daily', context }) },
      session.accessToken,
    );
    const allowed = allowedDifficulties(difficultyBias(context));
    const validated = validateAIGameMasterResponse(
      payload,
      context.recentQuests.map(quest => quest.title),
      allowed,
    );
    return validated ?? buildFallback(context, 3);
  } catch {
    return buildFallback(context, 3);
  }
}

export function requestDailyAIGameMaster(snapshot: SystemSnapshot): Promise<AIGameMasterResponse> {
  return requestContextAIGameMaster(buildAIGameMasterContext(snapshot));
}

export async function requestGoalAIGameMaster(
  snapshot: SystemSnapshot,
  rawGoal: string,
): Promise<AIGameMasterResponse> {
  const goal = rawGoal.trim().replace(/\s+/g, ' ');
  if (goal.length < 5 || goal.length > 200) throw new Error('Cel powinien mieć od 5 do 200 znaków.');
  const context = buildAIGameMasterContext(snapshot);
  context.goals = [{
    id: 'game-master-preview',
    title: goal,
    description: 'Cel wpisany przez gracza do podglądu kampanii.',
  }, ...context.goals].slice(0, 10);
  return requestContextAIGameMaster(context);
}
