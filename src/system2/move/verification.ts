import type {ActivityEvidence,ActivityType} from '../activity/types';
import type {MoveQuest} from './types';

export type MoveVerificationEvidence={
  questId:string;
  durationSeconds:number;
  distanceMeters?:number;
  steps?:number;
  activeMinutes?:number;
  parentApproved?:boolean;
  activity?:ActivityEvidence;
  source:'TIMER'|'GPS'|'STEPS'|'HEALTH'|'PARENT'|'MIXED';
};

export type MoveVerificationResult={
  ok:boolean;
  score:number;
  code:string;
  verifiedMinutes:number;
  distanceMeters:number;
  steps:number;
  activityType?:ActivityType;
};

export function moveExpectedActivity(quest:MoveQuest):ActivityType{
  if(quest.kind==='WALK'||quest.kind==='OUTDOOR'||quest.kind==='FAMILY')return'WALK';
  if(quest.kind==='RUN')return'RUN';
  if(quest.kind==='BIKE')return'BIKE';
  return'UNKNOWN';
}

export function moveMinimumDistance(quest:MoveQuest){
  if(quest.kind==='BIKE')return quest.minutes*120;
  if(quest.kind==='RUN')return quest.minutes*70;
  if(quest.kind==='WALK'||quest.kind==='OUTDOOR'||quest.kind==='FAMILY')return quest.minutes*35;
  return 0;
}

export function verifyMoveQuest(quest:MoveQuest,e:MoveVerificationEvidence):MoveVerificationResult{
  if(e.questId!==quest.id)return{ok:false,score:0,code:'QUEST_MISMATCH',verifiedMinutes:0,distanceMeters:0,steps:0};
  const requiredSeconds=Math.max(60,quest.minutes*60);
  const duration=Math.max(0,Math.floor(e.durationSeconds));
  const distance=Math.max(0,Number(e.distanceMeters??0));
  const steps=Math.max(0,Math.floor(Number(e.steps??0)));
  const activeMinutes=Math.max(0,Math.floor(Number(e.activeMinutes??0)));
  if(duration<requiredSeconds&&activeMinutes<quest.minutes)return{ok:false,score:0,code:'DURATION_TOO_SHORT',verifiedMinutes:Math.floor(duration/60),distanceMeters:distance,steps};

  if(quest.verification==='PARENT_APPROVAL'){
    return{ok:e.parentApproved===true,score:e.parentApproved?90:0,code:e.parentApproved?'PARENT_APPROVED':'PARENT_APPROVAL_REQUIRED',verifiedMinutes:quest.minutes,distanceMeters:distance,steps};
  }
  if(quest.verification==='GPS_DISTANCE'){
    const activity=e.activity;
    if(!activity)return{ok:false,score:0,code:'GPS_ACTIVITY_REQUIRED',verifiedMinutes:0,distanceMeters:distance,steps};
    if(activity.verdict!=='VERIFIED')return{ok:false,score:activity.verificationScore,code:'ACTIVITY_'+activity.verdict,verifiedMinutes:0,distanceMeters:distance,steps,activityType:activity.activityTypeDetected};
    const expected=moveExpectedActivity(quest);
    if(expected!=='UNKNOWN'&&activity.activityTypeDetected!==expected)return{ok:false,score:activity.verificationScore,code:'ACTIVITY_TYPE_MISMATCH',verifiedMinutes:0,distanceMeters:distance,steps,activityType:activity.activityTypeDetected};
    const min=moveMinimumDistance(quest);
    if(distance<min)return{ok:false,score:activity.verificationScore,code:'DISTANCE_TOO_SHORT',verifiedMinutes:Math.floor(duration/60),distanceMeters:distance,steps,activityType:activity.activityTypeDetected};
    return{ok:true,score:activity.verificationScore,code:'GPS_VERIFIED',verifiedMinutes:quest.minutes,distanceMeters:distance,steps,activityType:activity.activityTypeDetected};
  }
  if(quest.verification==='STEPS'){
    if(steps<=0)return{ok:false,score:0,code:'STEPS_REQUIRED',verifiedMinutes:0,distanceMeters:distance,steps};
    return{ok:true,score:90,code:'STEPS_VERIFIED',verifiedMinutes:quest.minutes,distanceMeters:distance,steps};
  }
  if(quest.verification==='HEALTH'){
    if(activeMinutes<quest.minutes)return{ok:false,score:0,code:'HEALTH_ACTIVE_MINUTES_REQUIRED',verifiedMinutes:activeMinutes,distanceMeters:distance,steps};
    return{ok:true,score:90,code:'HEALTH_VERIFIED',verifiedMinutes:quest.minutes,distanceMeters:distance,steps};
  }
  if(quest.verification==='MIXED'){
    const healthOk=activeMinutes>=quest.minutes||steps>0;
    const gpsOk=!!e.activity&&e.activity.verdict==='VERIFIED'&&distance>=moveMinimumDistance(quest);
    const parentOk=e.parentApproved===true;
    if(!healthOk&&!gpsOk&&!parentOk)return{ok:false,score:0,code:'MIXED_PROOF_REQUIRED',verifiedMinutes:0,distanceMeters:distance,steps};
    const score=gpsOk?e.activity!.verificationScore:healthOk?90:85;
    return{ok:true,score,code:gpsOk?'MIXED_GPS_VERIFIED':healthOk?'MIXED_HEALTH_VERIFIED':'MIXED_PARENT_VERIFIED',verifiedMinutes:quest.minutes,distanceMeters:distance,steps,activityType:e.activity?.activityTypeDetected};
  }
  return{ok:true,score:85,code:'TIMER_VERIFIED',verifiedMinutes:quest.minutes,distanceMeters:distance,steps};
}
