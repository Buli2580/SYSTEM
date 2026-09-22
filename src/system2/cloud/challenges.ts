import {getValidSession} from './auth';
import {cloudRequest} from './http';
import type {SocialChallenge,SocialChallengeMetric,ChallengeProgress} from '../social/challenges';

type ChallengeRow={id:string;title:string;metric:SocialChallengeMetric;target:number|string;starts_at:string;ends_at:string;visibility:SocialChallenge['visibility']};
type ProgressRow={challenge_id:string;user_id:string;value:number|string;updated_at:string};

async function session(){const s=await getValidSession();if(!s)throw new Error('Najpierw zaloguj SYSTEM CLOUD.');return s;}
function finiteNumber(value:number|string,label:string,{min=0,integer=false}:{min?:number;integer?:boolean}={}){
 const n=Number(value);
 if(!Number.isFinite(n)||n<min||(integer&&!Number.isInteger(n)))throw new Error('Nieprawidłowe dane SYSTEM CLOUD: '+label+'.');
 return n;
}
function validDate(value:string,label:string){if(!value||!Number.isFinite(Date.parse(value)))throw new Error('Nieprawidłowe dane SYSTEM CLOUD: '+label+'.');return value;}
function mapChallenge(row:ChallengeRow):SocialChallenge{
 const target=finiteNumber(row.target,'challenge target',{min:Number.EPSILON});
 const startsAt=validDate(row.starts_at,'challenge starts_at'),endsAt=validDate(row.ends_at,'challenge ends_at');
 if(Date.parse(endsAt)<=Date.parse(startsAt))throw new Error('Nieprawidłowe dane SYSTEM CLOUD: challenge window.');
 return{id:row.id,title:row.title,metric:row.metric,target,startsAt,endsAt,visibility:row.visibility};
}
function mapProgress(row:ProgressRow):ChallengeProgress{
 return{challengeId:row.challenge_id,playerId:row.user_id,value:finiteNumber(row.value,'challenge progress'),updatedAt:validDate(row.updated_at,'challenge progress updated_at')};
}

export async function getSocialChallenges(){const s=await session();const rows=await cloudRequest<ChallengeRow[]>('/rest/v1/rpc/get_active_social_challenges',{method:'POST',body:'{}'},s.accessToken);return rows.map(mapChallenge);}
export async function getChallengeProgress(id:string){const key=id.trim();if(!key)throw new Error('Nieprawidłowe wyzwanie.');const s=await session();const rows=await cloudRequest<ProgressRow[]>('/rest/v1/challenge_progress?challenge_id=eq.'+encodeURIComponent(key)+'&select=challenge_id,user_id,value,updated_at',{method:'GET'},s.accessToken);return rows.map(mapProgress);}
