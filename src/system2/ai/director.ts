import type { AIGameMasterContext, AIDirectorDecision } from './types';
import { difficultyBias } from './difficulty';

export function localDirector(
  context: AIGameMasterContext
): AIDirectorDecision {
  const bias = difficultyBias(context);

  if (context.player.systemDebt > 0) {
    return {
      mode: 'recovery',
      difficultyBias: -1,
      headline: 'RECOVERY PROTOCOL',
      message: 'SYSTEM DEBT aktywny. Najpierw wykonaj misję odzyskania synchronizacji.',
    };
  }

  if (bias > 0) {
    return {
      mode: 'challenge',
      difficultyBias: 1,
      headline: 'DIFFICULTY INCREASE AUTHORIZED',
      message: 'Twoja skuteczność pozwala zwiększyć poziom wyzwań.',
    };
  }

  return {
    mode: 'normal',
    difficultyBias: bias,
    headline: 'DAILY DIRECTIVE',
    message: 'SYSTEM dostosował dzisiejsze misje do ostatnich wyników.',
  };
}
