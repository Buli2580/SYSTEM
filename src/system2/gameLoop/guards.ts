import type { GameLoopPhase,GameLoopState } from './stateMachine';
const ORDER:GameLoopPhase[]=['HOME','BRIEFING','STARTING','ACTIVE','VERIFYING','COMPLETING','XP_REWARD','LOOT_REWARD','LEVEL_UP','EQUIP','WORLD_REACTION','NEXT_QUEST'];
export function phaseIndex(phase:GameLoopPhase){return ORDER.indexOf(phase);}
export function isMissionLocked(state:GameLoopState){return ['STARTING','VERIFYING','COMPLETING'].includes(state.phase);}
export function canNavigateAway(state:GameLoopState){return !isMissionLocked(state);}
export function hasRewardInFlight(state:GameLoopState){return ['XP_REWARD','LOOT_REWARD','LEVEL_UP','EQUIP','WORLD_REACTION'].includes(state.phase);}
export function assertLoopInvariant(state:GameLoopState){
 if(state.phase!=='HOME'&&!state.questId&&phaseIndex(state.phase)>=phaseIndex('BRIEFING')&&phaseIndex(state.phase)<=phaseIndex('COMPLETING')) throw new Error('Game Loop invariant: mission phase requires questId.');
 if(hasRewardInFlight(state)&&!state.rewardId) throw new Error('Game Loop invariant: reward phase requires rewardId.');
}
