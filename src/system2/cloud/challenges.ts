import {getValidSession} from './auth';
import {cloudRequest} from './http';
import type {SocialChallenge,SocialChallengeMetric,ChallengeProgress} from '../social/challenges';

type ChallengeRow={id:string;title:string;metric:SocialChallengeMetric;target:number|string;starts_at:string;ends_at:string;visibility:SocialChallenge['visibility']};
type ProgressRow={challenge_id:string;user_id:string;value:number|string;updated_at:string};

async function session(){const s=await getValidSession();if(!s)throw new Error('Najpierw zaloguj SYSTEM CLOUD.');return s;}
function mapChallenge(row:ChallengeRow):SocialChallenge{return{id:row.id,title:row.title,metric:row.metric,target:Number(row.target)||0,startsAt:row.starts_at,endsAt:row.ends_at,visibility:row.visibility};}
function mapProgress(row:ProgressRow):ChallengeProgress{return{challengeId:row.challenge_id,playerId:row.user_id,value:Number(row.value)||0,updatedAt:row.updated_at};}

export async function getSocialChallenges(){const s=await session();const rows=await cloudRequest<ChallengeRow[]>('/rest/v1/rpc/get_active_social_challenges',{method:'POST',body:'{}'},s.accessToken);return rows.map(mapChallenge);}
export async function getChallengeProgress(id:string){const s=await session();const rows=await cloudRequest<ProgressRow[]>('/rest/v1/challenge_progress?challenge_id=eq.'+encodeURIComponent(id)+'&select=challenge_id,user_id,value,updated_at',{method:'GET'},s.accessToken);return rows.map(mapProgress);}
