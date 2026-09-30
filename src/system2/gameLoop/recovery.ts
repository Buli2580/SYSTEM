import type { GameLoopPhase, GameLoopState } from './stateMachine';

export type GameLoopCheckpoint = {
  version: 1;
  state: GameLoopState;
  updatedAt: string;
};

export function checkpoint(state: GameLoopState, now = new Date().toISOString()): GameLoopCheckpoint {
  return { version: 1, state, updatedAt: now };
}

export function recoveryPhase(checkpointValue: GameLoopCheckpoint | null): GameLoopPhase {
  if (!checkpointValue) return 'HOME';
  const { phase, questId } = checkpointValue.state;
  if (['ACTIVE','VERIFYING','COMPLETING'].includes(phase) && questId) return 'RECOVERY';
  if (['XP_REWARD','LOOT_REWARD','LEVEL_UP','EQUIP','WORLD_REACTION'].includes(phase)) return phase;
  return phase === 'RECOVERY' ? 'RECOVERY' : 'HOME';
}

export function rewardPresentationKey(rewardId: string, phase: GameLoopPhase): string {
  return `game-loop:${rewardId}:${phase}`;
}

export function shouldPresentReward(processed: readonly string[], key: string): boolean {
  return !processed.includes(key);
}

export function markRewardPresented(processed: readonly string[], key: string): string[] {
  return processed.includes(key) ? [...processed] : [...processed, key].slice(-500);
}
