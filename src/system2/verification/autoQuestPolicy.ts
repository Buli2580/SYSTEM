/** Offline AutoQuest policy. A proposal is never a verification receipt or XP award. */
import type {RunnableQuest,QuestEvidence} from '../quests/types';
export type AutoQuestDecision=
 | {status:'READY';method:'TIMER'|'GPS_DISTANCE'|'MULTI';minimum:number;unit:'SECONDS'|'METERS';reason:'SUPPORTED'}
 | {status:'UNAVAILABLE';reason:'NO_PERMISSION'|'NO_SENSOR'|'INVALID_TARGET'|'UNSUPPORTED_METHOD'};
export type AutoQuestCapabilities={gps:boolean;timer:boolean;locationPermission:boolean;steps:boolean};
export function planAutoQuest(quest:RunnableQuest,cap:AutoQuestCapabilities):AutoQuestDecision{
 const verification=quest.verification;
 if(verification.type==='TIMER'){
  if(!Number.isFinite(verification.minimumDurationSeconds)||verification.minimumDurationSeconds<=0)return{status:'UNAVAILABLE',reason:'INVALID_TARGET'};
  return cap.timer?{status:'READY',method:'TIMER',minimum:verification.minimumDurationSeconds,unit:'SECONDS',reason:'SUPPORTED'}:{status:'UNAVAILABLE',reason:'NO_SENSOR'};
 }
 if(verification.type==='GPS_DISTANCE'||verification.type==='MULTI'){
  if(!Number.isFinite(verification.minimumDistanceMeters)||verification.minimumDistanceMeters<=0||
    (verification.type==='MULTI'&&(!Number.isFinite(verification.minimumDurationSeconds)||verification.minimumDurationSeconds<=0)))
   return{status:'UNAVAILABLE',reason:'INVALID_TARGET'};
  if(!cap.locationPermission)return{status:'UNAVAILABLE',reason:'NO_PERMISSION'};
  if(!cap.gps)return{status:'UNAVAILABLE',reason:'NO_SENSOR'};
  if(verification.type==='MULTI'&&!cap.timer)return{status:'UNAVAILABLE',reason:'NO_SENSOR'};
  return{status:'READY',method:verification.type,minimum:verification.minimumDistanceMeters,unit:'METERS',reason:'SUPPORTED'};
 }
 return{status:'UNAVAILABLE',reason:'UNSUPPORTED_METHOD'};
}
/** Only preflight evidence: canonical validation and durable reward still happen elsewhere. */
export function preflightAutoQuest(quest:RunnableQuest,evidence:QuestEvidence):boolean{
 if(evidence.questId!==quest.id||evidence.verificationType!==quest.verification.type)return false;
 if(!Number.isFinite(evidence.verificationScore)||evidence.verificationScore<quest.verification.verificationScoreRequired||evidence.verificationScore>100)return false;
 if(!Number.isFinite(evidence.durationSeconds)||evidence.durationSeconds<=0)return false;
 if(quest.verification.type==='TIMER')return evidence.distanceMeters===undefined&&evidence.durationSeconds>=quest.verification.minimumDurationSeconds;
 if(!Number.isFinite(evidence.distanceMeters)||evidence.distanceMeters<quest.verification.minimumDistanceMeters)return false;
 if(quest.verification.type==='MULTI'&&evidence.durationSeconds<quest.verification.minimumDurationSeconds)return false;
 return true;
}
