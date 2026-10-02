import {primaryGameLoopCTA} from './cta';
import type {GameLoopState} from './stateMachine';
export function selectHomeLoop(input:{missionId:string|null;activeQuestId:string|null;pendingRewardId?:string|null;observed?:GameLoopState}):GameLoopState {
 const {observed,pendingRewardId,activeQuestId,missionId}=input;
 if(pendingRewardId)return observed?.rewardId===pendingRewardId?observed:{phase:'XP_REWARD',questId:activeQuestId,rewardId:pendingRewardId,recoverable:false};
 if(activeQuestId)return observed?.questId===activeQuestId&&!observed.rewardId?observed:{phase:'ACTIVE',questId:activeQuestId,rewardId:null,recoverable:false};
 // Transient verifier states belong to the mounted run; a completed or expired mission never hides GM's next choice.
 if(observed?.questId===missionId&&['STARTING','VERIFYING','COMPLETING'].includes(observed.phase))return observed;
 return {phase:missionId?'BRIEFING':'HOME',questId:missionId,rewardId:null,recoverable:false};
}
export function selectPrimaryAction(state:GameLoopState){return {...primaryGameLoopCTA(state),phase:state.phase,missionId:state.questId};}
