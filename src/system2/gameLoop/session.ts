import type { GameLoopCheckpoint } from './recovery';
import { recoveryPhase } from './recovery';
import type { GameLoopState } from './stateMachine';
export function restoreGameLoop(value:GameLoopCheckpoint|null):GameLoopState{
 if(!value)return{phase:'HOME',questId:null,rewardId:null,recoverable:false};
 const phase=recoveryPhase(value);
 return{...value.state,phase,recoverable:phase==='RECOVERY'};
}
export function shouldResumeTracking(state:GameLoopState){return state.phase==='RECOVERY'&&Boolean(state.questId);}
export function shouldResumePresentation(state:GameLoopState){return ['XP_REWARD','LOOT_REWARD','LEVEL_UP','EQUIP','WORLD_REACTION'].includes(state.phase)&&Boolean(state.rewardId);}
