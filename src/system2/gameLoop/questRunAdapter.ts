import type { GameLoopPhase, GameLoopState } from './stateMachine';
export type QuestRunStatus = 'CHECKING'|'READY'|'STARTING'|'TRACKING'|'COMPLETING'|'COMPLETED'|'DENIED'|'ERROR'|'LOCKED';
/** An observation of the existing verifier, never permission to start GPS or grant XP. */
export function questRunLoopState(status:QuestRunStatus,questId:string):GameLoopState {
 const phases:Record<QuestRunStatus,GameLoopPhase>={CHECKING:'RECOVERY',READY:'BRIEFING',STARTING:'STARTING',TRACKING:'ACTIVE',COMPLETING:'VERIFYING',COMPLETED:'NEXT_QUEST',DENIED:'RECOVERY',ERROR:'RECOVERY',LOCKED:'HOME'};
 return {phase:phases[status],questId:status==='LOCKED'?null:questId,rewardId:null,recoverable:['CHECKING','DENIED','ERROR'].includes(status)};
}
