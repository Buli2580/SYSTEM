import {getValidSession} from './auth';
import {cloudRequest} from './http';
export type CloudSponsorChallenge2={id:string;sponsor_name:string;title:string;description:string;unit:'COUNT'|'MINUTES'|'KM';target:number;tier:'FREE'|'PREMIUM';starts_at:string;ends_at:string;reward_kind:'BADGE'|'COUPON'|'PHYSICAL'|'CASH'|'COSMETIC';reward_label:string;rules_url?:string|null;verified_value:number;joined:boolean;completed:boolean};
async function session(){const s=await getValidSession();if(!s)throw new Error('Najpierw zaloguj SYSTEM CLOUD.');return s;}
export async function getActiveSponsorChallenges2(){const s=await session();return cloudRequest<CloudSponsorChallenge2[]>('/rest/v1/rpc/get_active_sponsor_challenges_v2',{method:'POST',body:'{}'},s.accessToken);}
export async function joinSponsorChallenge2(id:string){const s=await session();await cloudRequest('/rest/v1/rpc/join_sponsor_challenge_v2',{method:'POST',body:JSON.stringify({p_challenge:id})},s.accessToken);}
export async function submitSponsorEvent2(id:string,eventKey:string){const s=await session();return cloudRequest<number>('/rest/v1/rpc/submit_sponsor_event_v2',{method:'POST',body:JSON.stringify({p_challenge:id,p_event_key:eventKey})},s.accessToken);}
