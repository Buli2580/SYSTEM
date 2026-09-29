/** Conservative preflight for automatic quest progress. Never awards XP or bypasses canonical verification. */
import type {RunnableQuest,QuestEvidence} from '../quests/types';
export type AutoQuestStatus='READY'|'IN_PROGRESS'|'VERIFY'|'BLOCKED';
export type AutoQuestDecision={status:AutoQuestStatus;progress:number;target:number;reason:string};
export type AutoQuestSignals={elapsedSeconds:number;distanceMeters:number;gpsPermission:boolean;locationAvailable:boolean;activityVerified:boolean};
const finite=(value:number)=>Number.isFinite(value)&&value>=0;
export function autoQuestDecision(quest:RunnableQuest,signals:AutoQuestSignals):AutoQuestDecision{
 const method=quest.verification.type;
 const target=method==='TIMER'?quest.verification.minimumDurationSeconds:quest.verification.minimumDistanceMeters;
 if(!finite(target)||target<=0||(method==='MULTI'&&(!finite(quest.verification.minimumDurationSeconds)||quest.verification.minimumDurationSeconds<=0)))return{status:'BLOCKED',progress:0,target:0,reason:'INVALID_TARGET'};
 if(!finite(signals.elapsedSeconds)||!finite(signals.distanceMeters))return{status:'BLOCKED',progress:0,target,reason:'INVALID_SIGNALS'};
 if(method!=='TIMER'&&(!signals.gpsPermission||!signals.locationAvailable))return{status:'BLOCKED',progress:0,target,reason:'LOCATION_UNAVAILABLE'};
 const progress=Math.min(target,method==='TIMER'?signals.elapsedSeconds:signals.distanceMeters);
 const enough=method==='TIMER'?signals.elapsedSeconds>=target:method==='MULTI'?signals.distanceMeters>=target&&signals.elapsedSeconds>=quest.verification.minimumDurationSeconds:signals.distanceMeters>=target;
 if(!enough)return{status:progress>0?'IN_PROGRESS':'READY',progress,target,reason:'TARGET_NOT_MET'};
 if(quest.activityType&&!signals.activityVerified)return{status:'BLOCKED',progress,target,reason:'ACTIVITY_NOT_VERIFIED'};
 return{status:'VERIFY',progress,target,reason:'CAN_REQUEST_CANONICAL_VERIFICATION'};
}
/** This only constructs a candidate. The canonical provider must independently validate it. */
export function autoQuestEvidenceCandidate(quest:RunnableQuest,signals:AutoQuestSignals,verificationScore:number,attemptId?:string):QuestEvidence|null{
 if(autoQuestDecision(quest,signals).status!=='VERIFY'||!Number.isFinite(verificationScore)||verificationScore<quest.verification.verificationScoreRequired||verificationScore>100)return null;
 if(quest.activityType)return null; // Requires the actual classified activity evidence, not a boolean.
 const base={questId:quest.id,attemptId,verificationScore,durationSeconds:signals.elapsedSeconds};
 return quest.verification.type==='TIMER'?{...base,verificationType:'TIMER'}:
  {...base,verificationType:quest.verification.type,distanceMeters:signals.distanceMeters};
}
