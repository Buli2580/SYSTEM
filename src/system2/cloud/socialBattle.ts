import {getValidSession} from './auth';
import {cloudRequest} from './http';

async function session(){const s=await getValidSession();if(!s)throw new Error('Najpierw zaloguj SYSTEM CLOUD.');return s;}

export type CloudPvpChallenge={
 id:string;creator_id:string;opponent_id:string;metric:'QUESTS'|'REAL_XP';target:number;
 creator_score:number;opponent_score:number;starts_at:string;ends_at:string;status:'OPEN'|'ACTIVE'|'COMPLETE'|'EXPIRED';
};
export type CloudGuildWar={id:string;guild_a:string;guild_b:string;starts_at:string;ends_at:string;score_a:number;score_b:number;status:'ACTIVE'|'COMPLETE'|'EXPIRED'};
export type CloudReferralState={code:string;invited:number;activated:number};
export type MyGuildSummary={guild_id:string;name:string;tag:string;role:'OWNER'|'OFFICER'|'MEMBER';level:number;xp:number};

export async function getMyPvpChallenges(){
 const s=await session();
 return cloudRequest<CloudPvpChallenge[]>('/rest/v1/rpc/get_my_pvp_challenges',{method:'POST',body:'{}'},s.accessToken);
}
export async function createPvpChallenge(opponentId:string,metric:'QUESTS'|'REAL_XP',target:number,hours=24){
 const s=await session();
 return cloudRequest<string>('/rest/v1/rpc/create_pvp_challenge',{method:'POST',body:JSON.stringify({p_opponent:opponentId,p_metric:metric,p_target:target,p_hours:hours})},s.accessToken);
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
 return cloudRequest<CloudGuildWar[]>('/rest/v1/rpc/get_active_guild_wars',{method:'POST',body:'{}'},s.accessToken);
}
export async function getMyGuildSummary(){
 const s=await session();
 const rows=await cloudRequest<MyGuildSummary[]>('/rest/v1/rpc/get_my_guild_summary',{method:'POST',body:'{}'},s.accessToken);
 return rows[0]??null;
}
export async function createGuildWar(opponentGuildId:string,hours=72){
 const s=await session();
 return cloudRequest<string>('/rest/v1/rpc/create_guild_war',{method:'POST',body:JSON.stringify({p_opponent_guild:opponentGuildId,p_hours:hours})},s.accessToken);
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
 const s=await session();
 await cloudRequest('/rest/v1/rpc/attach_referral_code',{method:'POST',body:JSON.stringify({p_code:code.trim().toUpperCase()})},s.accessToken);
}
export async function activateReferral(eventKey:string){
 const s=await session();
 await cloudRequest('/rest/v1/rpc/activate_referral',{method:'POST',body:JSON.stringify({p_event_key:eventKey})},s.accessToken);
}
