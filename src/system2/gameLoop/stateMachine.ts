export type GameLoopPhase =
  | 'HOME'
  | 'BRIEFING'
  | 'STARTING'
  | 'ACTIVE'
  | 'VERIFYING'
  | 'COMPLETING'
  | 'XP_REWARD'
  | 'LOOT_REWARD'
  | 'LEVEL_UP'
  | 'EQUIP'
  | 'WORLD_REACTION'
  | 'NEXT_QUEST'
  | 'RECOVERY';

export type GameLoopEvent =
  | 'OPEN'
  | 'SELECT_QUEST'
  | 'START'
  | 'STARTED'
  | 'VERIFY'
  | 'VERIFIED'
  | 'COMPLETE'
  | 'XP_PRESENTED'
  | 'LOOT_PRESENTED'
  | 'LEVEL_PRESENTED'
  | 'EQUIP_DONE'
  | 'WORLD_REACTED'
  | 'CONTINUE'
  | 'FAIL'
  | 'RESUME';

export type GameLoopState = {
  phase: GameLoopPhase;
  questId: string | null;
  rewardId: string | null;
  recoverable: boolean;
};

export const INITIAL_GAME_LOOP_STATE: GameLoopState = {
  phase: 'HOME',
  questId: null,
  rewardId: null,
  recoverable: false,
};

export function reduceGameLoop(state: GameLoopState, event: GameLoopEvent, payload?: { questId?: string; rewardId?: string; levelUp?: boolean; hasLoot?: boolean }): GameLoopState {
  if (event === 'FAIL') return { ...state, phase: 'RECOVERY', recoverable: true };
  if (event === 'RESUME' && state.phase === 'RECOVERY') return { ...state, phase: state.questId ? 'ACTIVE' : 'HOME', recoverable: false };
  switch (state.phase) {
    case 'HOME':
      return event === 'SELECT_QUEST' ? { phase: 'BRIEFING', questId: payload?.questId ?? null, rewardId: null, recoverable: false } : state;
    case 'BRIEFING':
      return event === 'START' ? { ...state, phase: 'STARTING' } : state;
    case 'STARTING':
      return event === 'STARTED' ? { ...state, phase: 'ACTIVE' } : state;
    case 'ACTIVE':
      return event === 'VERIFY' ? { ...state, phase: 'VERIFYING' } : state;
    case 'VERIFYING':
      return event === 'VERIFIED' ? { ...state, phase: 'COMPLETING' } : state;
    case 'COMPLETING':
      return event === 'COMPLETE' ? { ...state, phase: 'XP_REWARD', rewardId: payload?.rewardId ?? state.rewardId } : state;
    case 'XP_REWARD':
      if (event !== 'XP_PRESENTED') return state;
      return { ...state, phase: payload?.hasLoot ? 'LOOT_REWARD' : payload?.levelUp ? 'LEVEL_UP' : 'WORLD_REACTION' };
    case 'LOOT_REWARD':
      if (event !== 'LOOT_PRESENTED') return state;
      return { ...state, phase: payload?.levelUp ? 'LEVEL_UP' : 'EQUIP' };
    case 'LEVEL_UP':
      return event === 'LEVEL_PRESENTED' ? { ...state, phase: payload?.hasLoot ? 'EQUIP' : 'WORLD_REACTION' } : state;
    case 'EQUIP':
      return event === 'EQUIP_DONE' ? { ...state, phase: 'WORLD_REACTION' } : state;
    case 'WORLD_REACTION':
      return event === 'WORLD_REACTED' ? { ...state, phase: 'NEXT_QUEST' } : state;
    case 'NEXT_QUEST':
      return event === 'CONTINUE'
        ? { phase: payload?.questId ? 'BRIEFING' : 'HOME', questId: payload?.questId ?? null, rewardId: null, recoverable: false }
        : state;
    default:
      return state;
  }
}

export function canContinueMission(state: GameLoopState): boolean {
  return ['BRIEFING','STARTING','ACTIVE','VERIFYING','COMPLETING','RECOVERY'].includes(state.phase);
}
