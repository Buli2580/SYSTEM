import AsyncStorage from '@react-native-async-storage/async-storage';
import {getValidSession} from './auth';
import {cloudRequest} from './http';
import {loadMoveState} from '../storage/database';

export type MoveGroupKind='FAMILY'|'SCHOOL';
export type MoveGroupRole='PARENT'|'CHILD'|'MEMBER'|'TEACHER'|'STUDENT';
export type CloudMoveGroup={
  id:string;kind:MoveGroupKind;name:string;role:MoveGroupRole;
  memberCount:number;totalMinutes:number;activeDays:number;
};
export type CloudMoveLeaderboardRow={
  userId:string;verifiedMinutes:number;activeDays:number;contributionScore:number;
};

const MOVE_VERIFY_OUTBOX_KEY='system.move.serverVerification.v3';
export type SupportedMoveCloudQuest='move_walk_10'|'move_run_10'|'move_bike_20';
export type PendingMoveServerVerification={
  questId:SupportedMoveCloudQuest;
  dayKey:string;
  durationSeconds:number;
  distanceMeters:number;
  verificationScore:number;
  activityType:'WALK'|'RUN'|'BIKE';
};
const EXPECTED_MOVE_ACTIVITY:Record<SupportedMoveCloudQuest,PendingMoveServerVerification['activityType']>={
  move_walk_10:'WALK',move_run_10:'RUN',move_bike_20:'BIKE',
};
export function supportsMoveServerVerification(id:string):id is SupportedMoveCloudQuest{
  return Object.prototype.hasOwnProperty.call(EXPECTED_MOVE_ACTIVITY,id);
}
function validPendingMove(row:unknown):row is PendingMoveServerVerification{
  if(!row||typeof row!=='object')return false;
  const x=row as Partial<PendingMoveServerVerification>;
  return typeof x.questId==='string'&&supportsMoveServerVerification(x.questId)&&
    typeof x.dayKey==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x.dayKey)&&
    typeof x.durationSeconds==='number'&&Number.isFinite(x.durationSeconds)&&x.durationSeconds>=0&&x.durationSeconds<=172800&&
    typeof x.distanceMeters==='number'&&Number.isFinite(x.distanceMeters)&&x.distanceMeters>=0&&x.distanceMeters<=500000&&
    typeof x.verificationScore==='number'&&Number.isSafeInteger(x.verificationScore)&&x.verificationScore>=0&&x.verificationScore<=100&&
    x.activityType===EXPECTED_MOVE_ACTIVITY[x.questId];
}
async function loadMoveVerifyOutbox():Promise<PendingMoveServerVerification[]>{
  try{
    const raw=await AsyncStorage.getItem(MOVE_VERIFY_OUTBOX_KEY),parsed=raw?JSON.parse(raw):[];
    return Array.isArray(parsed)?parsed.filter(validPendingMove).slice(-30):[];
  }catch{return[];}
}
async function saveMoveVerifyOutbox(rows:PendingMoveServerVerification[]){
  const safe=rows.filter(validPendingMove).slice(-30);
  await AsyncStorage.setItem(MOVE_VERIFY_OUTBOX_KEY,JSON.stringify(safe));
  return safe;
}
export async function queueMoveServerVerification(input:PendingMoveServerVerification){
  if(!validPendingMove(input))throw new Error('Nieprawidłowy dowód MOVE do synchronizacji.');
  const rows=await loadMoveVerifyOutbox();
  const key=input.dayKey+'|'+input.questId;
  const next=[...rows.filter(x=>x.dayKey+'|'+x.questId!==key),input];
  await saveMoveVerifyOutbox(next);
}
export async function pendingMoveServerVerificationCount(){
  return (await loadMoveVerifyOutbox()).length;
}
export async function submitMoveVerifiedEventV3(input:PendingMoveServerVerification){
  if(!validPendingMove(input))throw new Error('Nieprawidłowy dowód MOVE.');
  const s=await session();
  return cloudRequest<string>('/rest/v1/rpc/submit_move_verified_event_v3',{
    method:'POST',
    body:JSON.stringify({
      p_move_quest_id:input.questId,
      p_day_key:input.dayKey,
      p_duration_seconds:Math.floor(input.durationSeconds),
      p_distance_meters:Math.floor(input.distanceMeters),
      p_confidence_score:input.verificationScore,
      p_activity_type:input.activityType,
    }),
  },s.accessToken);
}
export async function flushPendingMoveServerVerifications(limit=20){
  const rows=await loadMoveVerifyOutbox();
  if(!rows.length)return{sent:0,pending:0};
  const s=await getValidSession();
  if(!s)return{sent:0,pending:rows.length};
  const keep:PendingMoveServerVerification[]=[];
  let sent=0;
  for(const row of rows.slice(0,Math.max(1,Math.min(30,Math.floor(limit))))){
    try{
      await cloudRequest<string>('/rest/v1/rpc/submit_move_verified_event_v3',{
        method:'POST',
        body:JSON.stringify({
          p_move_quest_id:row.questId,p_day_key:row.dayKey,
          p_duration_seconds:Math.floor(row.durationSeconds),
          p_distance_meters:Math.floor(row.distanceMeters),
          p_confidence_score:row.verificationScore,
          p_activity_type:row.activityType,
        }),
      },s.accessToken);
      sent++;
    }catch{keep.push(row);}
  }
  keep.push(...rows.slice(Math.max(1,Math.min(30,Math.floor(limit)))));
  await saveMoveVerifyOutbox(keep);
  return{sent,pending:keep.length};
}

async function session(){const s=await getValidSession();if(!s)throw new Error('Najpierw zaloguj SYSTEM CLOUD.');return s;}
function int(value:number|string,label:string,min=0){const n=Number(value);if(!Number.isSafeInteger(n)||n<min)throw new Error('Nieprawidłowe dane SYSTEM CLOUD: '+label+'.');return n;}
function groupKind(value:string):MoveGroupKind{if(value==='FAMILY'||value==='SCHOOL')return value;throw new Error('Nieprawidłowy typ grupy MOVE.');}
function groupRole(value:string):MoveGroupRole{if(['PARENT','CHILD','MEMBER','TEACHER','STUDENT'].includes(value))return value as MoveGroupRole;throw new Error('Nieprawidłowa rola MOVE.');}

type GroupRow={id:string;kind:string;name:string;role:string;member_count:number|string;total_minutes:number|string;active_days:number|string};
export async function getMyMoveGroups():Promise<CloudMoveGroup[]>{
 const s=await session();
 const rows=await cloudRequest<GroupRow[]>('/rest/v1/rpc/get_my_move_groups',{method:'POST',body:'{}'},s.accessToken);
 return rows.map(row=>({
   id:row.id,kind:groupKind(row.kind),name:String(row.name||'').trim(),role:groupRole(row.role),
   memberCount:int(row.member_count,'move member_count',1),
   totalMinutes:int(row.total_minutes,'move total_minutes'),
   activeDays:int(row.active_days,'move active_days'),
 }));
}
export async function createMoveGroup(kind:MoveGroupKind,name:string){
 const safe=name.trim();if(safe.length<2||safe.length>60)throw new Error('Nazwa grupy MOVE musi mieć 2–60 znaków.');
 const s=await session();
 return cloudRequest<string>('/rest/v1/rpc/create_move_group',{method:'POST',body:JSON.stringify({p_kind:kind,p_name:safe})},s.accessToken);
}
export async function createMoveGroupInvite(groupId:string,role:MoveGroupRole,maxUses=1,expiresHours=24){
 const id=groupId.trim();if(!id)throw new Error('Nieprawidłowa grupa MOVE.');
 const s=await session();
 return cloudRequest<string>('/rest/v1/rpc/create_move_group_invite',{method:'POST',body:JSON.stringify({
   p_group:id,p_role:role,p_max_uses:Math.max(1,Math.min(100,Math.floor(maxUses))),p_expires_hours:Math.max(1,Math.min(168,Math.floor(expiresHours))),
 })},s.accessToken);
}
export async function joinMoveGroup(inviteCode:string){
 const code=inviteCode.trim().toUpperCase();if(!/^[A-Z0-9]{12}$/.test(code))throw new Error('Nieprawidłowy kod zaproszenia MOVE.');
 const s=await session();
 return cloudRequest<string>('/rest/v1/rpc/join_move_group',{method:'POST',body:JSON.stringify({p_code:code})},s.accessToken);
}
// A client-side MOVE pass does not count as verified cloud ranking evidence.
// The server must first have processed a matching core quest event.
type VerifiedSourceRow={event_key:string};
export async function getMyVerifiedMoveSource(moveQuestId:string,dayKey:string):Promise<string|null>{
 if(!/^\d{4}-\d{2}-\d{2}$/.test(dayKey))throw new Error('Nieprawidłowy dzień MOVE.');
 const s=await session();
 const rows=await cloudRequest<VerifiedSourceRow[]>('/rest/v1/rpc/get_my_move_verified_source',{
   method:'POST',body:JSON.stringify({p_move_quest_id:moveQuestId,p_day_key:dayKey}),
 },s.accessToken);
 return rows[0]?.event_key??null;
}
export async function submitVerifiedMoveContribution(input:{groupId:string;eventKey:string;questId:string;dayKey:string}){
 if(!/^verified:[A-Za-z0-9._:-]{1,180}$/.test(input.eventKey))throw new Error('Nieprawidłowy klucz potwierdzenia MOVE.');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(input.dayKey))throw new Error('Nieprawidłowy dzień MOVE.');
 const s=await session();
 return cloudRequest<number>('/rest/v1/rpc/submit_verified_move_contribution',{
   method:'POST',body:JSON.stringify({
     p_group:input.groupId,p_evidence_event_key:input.eventKey,
     p_move_quest_id:input.questId,p_day_key:input.dayKey,
   }),
 },s.accessToken);
}
type LeaderRow={user_id:string;verified_minutes:number|string;active_days:number|string;contribution_score:number|string};
export async function getMoveGroupLeaderboard(groupId:string,days=7):Promise<CloudMoveLeaderboardRow[]>{
 const s=await session();
 const rows=await cloudRequest<LeaderRow[]>('/rest/v1/rpc/get_move_group_leaderboard',{method:'POST',body:JSON.stringify({p_group:groupId,p_days:Math.max(1,Math.min(31,Math.floor(days)))})},s.accessToken);
 return rows.map(row=>({userId:row.user_id,verifiedMinutes:int(row.verified_minutes,'verified_minutes'),activeDays:int(row.active_days,'active_days'),contributionScore:int(row.contribution_score,'contribution_score')}));
}
// The local session remains complete offline. Family/School cloud credit
// requires independently processed core evidence (currently WALK/RUN/BIKE).
export async function publishVerifiedMoveToGroups(input:{
 kinds:MoveGroupKind[];questId:string;dayKey:string;
}){
 const groups=await getMyMoveGroups();
 const targets=groups.filter(g=>input.kinds.includes(g.kind));
 if(!targets.length)return{groups:0,submitted:0,pending:0,failed:0};
 const evidenceKey=await getMyVerifiedMoveSource(input.questId,input.dayKey);
 if(!evidenceKey)return{groups:targets.length,submitted:0,pending:targets.length,failed:0};
 const results=await Promise.allSettled(targets.map(group=>submitVerifiedMoveContribution({
   groupId:group.id,eventKey:evidenceKey,questId:input.questId,dayKey:input.dayKey,
 })));
 return{groups:targets.length,submitted:results.filter(r=>r.status==='fulfilled').length,
   pending:0,failed:results.filter(r=>r.status==='rejected').length};
}

// On reconnect, recover eligible group credits from already-persisted local
// MOVE history without uploading sensitive raw locations or trusting local XP.
// Only separately accepted core GPS quests can satisfy this protocol.
export async function reconcileRecentMoveContributions(){
 await flushPendingMoveServerVerifications().catch(()=>({sent:0,pending:0}));
 const state=await loadMoveState();
 const supported=new Set(['move_walk_10','move_run_10','move_bike_20']);
 const recent=[...state.history.slice(-6),{
   dayKey:state.dayKey,minutes:state.activeMinutes,questIds:state.completedQuestIds,
 }];
 const candidates=[...new Set(recent.flatMap(day=>
   day.questIds.filter(id=>supported.has(id)).map(id=>day.dayKey+'|'+id)
 ))];
 if(!candidates.length)return{reviewed:0,accepted:0,failed:0};
 const groups=await getMyMoveGroups();
 if(!groups.length)return{reviewed:candidates.length,accepted:0,failed:0};
 let accepted=0,failed=0;
 for(const value of candidates){
   const [dayKey,questId]=value.split('|');
   const evidence=await getMyVerifiedMoveSource(questId,dayKey);
   if(!evidence)continue;
   const results=await Promise.allSettled(groups.map(group=>
     submitVerifiedMoveContribution({groupId:group.id,eventKey:evidence,questId,dayKey})
   ));
   accepted+=results.filter(r=>r.status==='fulfilled'&&r.value>0).length;
   failed+=results.filter(r=>r.status==='rejected').length;
 }
 return{reviewed:candidates.length,accepted,failed};
}
