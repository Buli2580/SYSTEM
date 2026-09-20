import type { AIGameMasterContext, AIQuestDifficulty } from './types';

export function difficultyBias(
  context: AIGameMasterContext
): -1 | 0 | 1 {
  const { completionRate7d, streak, systemDebt } = context.player;
  if (systemDebt >= 2) return -1;
  if (completionRate7d >= 0.85 && streak >= 4) return 1;
  if (completionRate7d < 0.5) return -1;
  return 0;
}

export function allowedDifficulties(
  bias: -1 | 0 | 1
): AIQuestDifficulty[] {
  if (bias < 0) return ['easy', 'medium'];
  if (bias > 0) return ['medium', 'hard'];
  return ['easy', 'medium', 'hard'];
}
