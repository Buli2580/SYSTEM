import type { RewardReceipt } from '../core/rewards';
import type { GameLoopPhase } from './stateMachine';

export type GameLoopTelemetryEvent =
  | 'LOOP_HOME'
  | 'LOOP_BRIEFING'
  | 'LOOP_START'
  | 'LOOP_ACTIVE'
  | 'LOOP_VERIFY'
  | 'LOOP_COMPLETE'
  | 'LOOP_XP'
  | 'LOOP_LOOT'
  | 'LOOP_LEVEL_UP'
  | 'LOOP_EQUIP'
  | 'LOOP_WORLD_REACTION'
  | 'LOOP_NEXT_QUEST'
  | 'LOOP_RECOVERY';

export type GameLoopTelemetry = {
  event: GameLoopTelemetryEvent;
  phase: GameLoopPhase;
  questId?: string;
  rewardId?: string;
  at: string;
  properties?: Record<string, string | number | boolean>;
};

const eventByPhase: Record<GameLoopPhase, GameLoopTelemetryEvent> = {
  HOME:'LOOP_HOME', BRIEFING:'LOOP_BRIEFING', STARTING:'LOOP_START', ACTIVE:'LOOP_ACTIVE',
  VERIFYING:'LOOP_VERIFY', COMPLETING:'LOOP_COMPLETE', XP_REWARD:'LOOP_XP', LOOT_REWARD:'LOOP_LOOT',
  LEVEL_UP:'LOOP_LEVEL_UP', EQUIP:'LOOP_EQUIP', WORLD_REACTION:'LOOP_WORLD_REACTION',
  NEXT_QUEST:'LOOP_NEXT_QUEST', RECOVERY:'LOOP_RECOVERY',
};

export function loopSignal(phase: GameLoopPhase, input: { questId?: string | null; reward?: RewardReceipt | null; properties?: GameLoopTelemetry['properties'] } = {}): GameLoopTelemetry {
  return {
    event: eventByPhase[phase],
    phase,
    at: new Date().toISOString(),
    ...(input.questId ? { questId: input.questId } : {}),
    ...(input.reward?.id ? { rewardId: input.reward.id } : {}),
    ...(input.properties ? { properties: input.properties } : {}),
  };
}
