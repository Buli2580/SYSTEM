import {getValidSession} from './auth';
import {cloudRequest} from './http';

export type MoveGroupKind='FAMILY'|'SCHOOL';
export type MoveGroupRole='PARENT'|'CHILD'|'MEMBER'|'TEACHER'|'STUDENT';
export type CloudMoveGroup={
  id:string;kind:MoveGroupKind;name:string;role:MoveGroupRole;
  memberCount:number;totalMinutes:number;activeDays:number;
};
export type CloudMoveLeaderboardRow={
  userId:string;verifiedMinutes:number;activeDays:number;contributionScore:number;
};

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
 if(!/^\\d{4}-\\d{2}-\\d{2}$/.test(dayKey))throw new Error('Nieprawidłowy dzień MOVE.');
 const s=await session();
 const rows=await cloudRequest<VerifiedSourceRow[]>('/rest/v1/rpc/get_my_move_verified_source',{
   method:'POST',body:JSON.stringify({p_move_quest_id:moveQuestId,p_day_key:dayKey}),
 },s.accessToken);
 return rows[0]?.event_key??null;
}
export async function submitVerifiedMoveContribution(input:{groupId:string;eventKey:string;questId:string;dayKey:string}){
 if(!/^verified:[A-Za-z0-9._:-]{1,180}$/.test(input.eventKey))throw new Error('Nieprawidłowy klucz potwierdzenia MOVE.');
 if(!/^\\d{4}-\\d{2}-\\d{2}$/.test(input.dayKey))throw new Error('Nieprawidłowy dzień MOVE.');
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
