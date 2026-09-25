import {getValidSession} from './auth';
import {cloudRequest} from './http';

async function session(){const s=await getValidSession();if(!s)throw new Error('Najpierw zaloguj SYSTEM CLOUD.');return s;}

export type CloudPvpChallenge={
 id:string;creator_id:string;opponent_id:string;creator_name:string;opponent_name:string;
 metric:'QUESTS'|'REAL_XP';target:number;creator_score:number;opponent_score:number;
 starts_at:string;ends_at:string;status:'OPEN'|'ACTIVE'|'COMPLETE'|'EXPIRED';
 my_side:'CREATOR'|'OPPONENT';my_score:number;rival_score:number;progress_percent:number;
};
export type CloudGuildWar={
 id:string;guild_a:string;guild_b:string;guild_a_name:string;guild_a_tag:string;guild_b_name:string;guild_b_tag:string;
 score_a:number;score_b:number;starts_at:string;ends_at:string;status:'ACTIVE'|'COMPLETE'|'EXPIRED';
 my_guild_id:string;my_side:'A'|'B';my_contribution:number;my_verified_events:number;
};
export type CloudReferralState={code:string;invited:number;activated:number};
export type MyGuildSummary={guild_id:string;name:string;tag:string;role:'OWNER'|'OFFICER'|'MEMBER';level:number;xp:number};

export async function getMyPvpChallenges(){
 const s=await session();
 return cloudRequest<CloudPvpChallenge[]>('/rest/v1/rpc/get_my_pvp_challenges_v3',{method:'POST',body:'{}'},s.accessToken);
}
export async function createPvpChallenge(opponentId:string,metric:'QUESTS'|'REAL_XP',target:number,hours=24){
 const opponent=opponentId.trim();
 if(!opponent)throw new Error('Nieprawidłowy przeciwnik PvP.');
 if(!Number.isFinite(target)||!Number.isFinite(hours))throw new Error('Nieprawidłowe parametry wyzwania PvP.');
 const safeTarget=Math.max(1,Math.min(metric==='QUESTS'?100:100000,Math.floor(target)));
 const s=await session();
 if(opponent===s.user.id)throw new Error('Nie możesz wyzwać własnego profilu.');
 return cloudRequest<string>('/rest/v1/rpc/create_pvp_challenge',{method:'POST',body:JSON.stringify({p_opponent:opponent,p_metric:metric,p_target:safeTarget,p_hours:Math.max(1,Math.min(168,Math.floor(hours)))})},s.accessToken);
}
export async function acceptPvpChallenge(challengeId:string){
 const s=await session();
 await cloudRequest('/rest/v1/rpc/accept_pvp_challenge',{method:'POST',body:JSON.stringify({p_challenge:challengeId})},s.accessToken);
}
export async function submitPvpEvent(challengeId:string,eventKey:string){
 const s=await session();
 await cloudRequest('/rest/v1/rpc/submit_pvp_event',{method:'POST',body:JSON.stringify({p_challenge:challengeId,p_event_key:eventKey})},s.accessToken);
}
export async function getActiveGuildWars(){
 const s=await session();
 return cloudRequest<CloudGuildWar[]>('/rest/v1/rpc/get_my_guild_wars_v3',{method:'POST',body:'{}'},s.accessToken);
}
export async function getMyGuildSummary(){
 const s=await session();
 const rows=await cloudRequest<MyGuildSummary[]>('/rest/v1/rpc/get_my_guild_summary',{method:'POST',body:'{}'},s.accessToken);
 return rows[0]??null;
}
export async function createGuildWar(opponentGuildId:string,hours=72){
 const opponent=opponentGuildId.trim();
 if(!opponent)throw new Error('Nieprawidłowa gildia przeciwnika.');
 if(!Number.isFinite(hours))throw new Error('Nieprawidłowy czas Guild War.');
 const s=await session();
 return cloudRequest<string>('/rest/v1/rpc/create_guild_war',{method:'POST',body:JSON.stringify({p_opponent_guild:opponent,p_hours:Math.max(6,Math.min(168,Math.floor(hours)))})},s.accessToken);
}
export async function submitGuildWarEvent(warId:string,eventKey:string){
 const s=await session();
 await cloudRequest('/rest/v1/rpc/submit_guild_war_event',{method:'POST',body:JSON.stringify({p_war:warId,p_event_key:eventKey})},s.accessToken);
}
export async function ensureReferralCode(){
 const s=await session();
 return cloudRequest<string>('/rest/v1/rpc/ensure_referral_code',{method:'POST',body:'{}'},s.accessToken);
}
export async function getReferralState(){
 const s=await session();
 const rows=await cloudRequest<CloudReferralState[]>('/rest/v1/rpc/get_referral_state',{method:'POST',body:'{}'},s.accessToken);
 return rows[0]??{code:'',invited:0,activated:0};
}
export async function attachReferralCode(code:string){
 const normalized=code.trim().toUpperCase();
 if(!/^[A-Z0-9_-]{3,32}$/.test(normalized))throw new Error('Nieprawidłowy kod polecający.');
 const s=await session();
 await cloudRequest('/rest/v1/rpc/attach_referral_code',{method:'POST',body:JSON.stringify({p_code:normalized})},s.accessToken);
}
export async function activateReferral(eventKey:string){
 const s=await session();
 await cloudRequest('/rest/v1/rpc/activate_referral',{method:'POST',body:JSON.stringify({p_event_key:eventKey})},s.accessToken);
}
