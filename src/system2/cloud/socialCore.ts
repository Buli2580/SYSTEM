import {getValidSession} from './auth';
import {cloudRequest} from './http';
import type {FriendshipState,SocialActivityEvent,SocialCounts} from '../social';

async function session(){const s=await getValidSession();if(!s)throw new Error('Najpierw zaloguj SYSTEM CLOUD.');return s;}
function cleanTarget(id:string){const value=id.trim();if(!value)throw new Error('Nieprawidłowy identyfikator gracza.');return value;}
function countValue(rows:{count:number|string}[],label:string){const n=Number(rows[0]?.count);if(!Number.isFinite(n)||!Number.isInteger(n)||n<0)throw new Error('Nieprawidłowe dane SYSTEM CLOUD: '+label+'.');return n;}

export async function blockSocialPlayer(id:string){const s=await session();const target=cleanTarget(id);if(target===s.user.id)throw new Error('Nie możesz zablokować własnego profilu.');await cloudRequest('/rest/v1/rpc/block_social_player',{method:'POST',body:JSON.stringify({p_target:target})},s.accessToken);}
export async function unblockSocialPlayer(id:string){const s=await session();const target=cleanTarget(id);await cloudRequest('/rest/v1/social_blocks?blocker_id=eq.'+encodeURIComponent(s.user.id)+'&blocked_id=eq.'+encodeURIComponent(target),{method:'DELETE'},s.accessToken);}
export async function sendCloudFriendRequest(id:string){const s=await session();const target=cleanTarget(id);if(target===s.user.id)throw new Error('Nie możesz wysłać zaproszenia do siebie.');await cloudRequest('/rest/v1/rpc/send_friend_request',{method:'POST',body:JSON.stringify({p_target:target})},s.accessToken);}
export async function respondCloudFriendRequest(senderId:string,accept:boolean){const s=await session();await cloudRequest('/rest/v1/rpc/respond_friend_request',{method:'POST',body:JSON.stringify({p_sender:cleanTarget(senderId),p_accept:accept})},s.accessToken);}
export async function getCloudFriendship(id:string):Promise<FriendshipState>{
 const s=await session(),target=cleanTarget(id);
 const rows=await cloudRequest<{sender_id:string;receiver_id:string;status:string}[]>('/rest/v1/friend_requests?or=(and(sender_id.eq.'+encodeURIComponent(s.user.id)+',receiver_id.eq.'+encodeURIComponent(target)+'),and(sender_id.eq.'+encodeURIComponent(target)+',receiver_id.eq.'+encodeURIComponent(s.user.id)+'))&select=sender_id,receiver_id,status&limit=1',{method:'GET'},s.accessToken);
 const r=rows[0];if(!r)return'NONE';if(r.status==='accepted')return'FRIENDS';if(r.status!=='pending')throw new Error('Nieprawidłowe dane SYSTEM CLOUD: friendship status.');return r.sender_id===s.user.id?'REQUEST_SENT':'REQUEST_RECEIVED';
}
export async function publishVerifiedQuestActivity(eventKey:string){const s=await session();const key=eventKey.trim();if(!/^verified:[A-Za-z0-9._:-]{1,180}$/.test(key))throw new Error('Nieprawidłowy klucz zweryfikowanego zdarzenia.');await cloudRequest('/rest/v1/rpc/publish_verified_social_activity',{method:'POST',body:JSON.stringify({p_event_key:key})},s.accessToken);}
export async function publishSocialActivity(event:Omit<SocialActivityEvent,'id'|'playerId'>){const key=event.metadata?.eventKey;if(event.type!=='QUEST_COMPLETED'||typeof key!=='string')throw new Error('Activity Feed przyjmuje tylko zdarzenia potwierdzone przez SYSTEM CLOUD.');await publishVerifiedQuestActivity(key);}
export async function getCloudSocialCounts():Promise<SocialCounts>{
 const s=await session();
 const[a,b,c]=await Promise.all([
  cloudRequest<{count:number|string}[]>('/rest/v1/rpc/social_followers_count',{method:'POST',body:'{}'},s.accessToken),
  cloudRequest<{count:number|string}[]>('/rest/v1/rpc/social_following_count',{method:'POST',body:'{}'},s.accessToken),
  cloudRequest<{count:number|string}[]>('/rest/v1/rpc/social_friends_count',{method:'POST',body:'{}'},s.accessToken),
 ]);
 return{followers:countValue(a,'followers count'),following:countValue(b,'following count'),friends:countValue(c,'friends count')};
}
export type CloudFriendRow={user_id:string;handle:string|null;public_name:string|null;real_level:number;rank:string;status:'REQUEST_SENT'|'REQUEST_RECEIVED'|'FRIENDS'};
function mapFriend(row:CloudFriendRow):CloudFriendRow{
 const level=Number(row.real_level);
 if(!row?.user_id?.trim()||!Number.isSafeInteger(level)||level<1)throw new Error('Nieprawidłowe dane SYSTEM CLOUD: friend identity.');
 if(!['REQUEST_SENT','REQUEST_RECEIVED','FRIENDS'].includes(row.status))throw new Error('Nieprawidłowe dane SYSTEM CLOUD: friend status.');
 if(typeof row.rank!=='string'||!row.rank.trim())throw new Error('Nieprawidłowe dane SYSTEM CLOUD: friend rank.');
 if(row.handle!==null&&typeof row.handle!=='string')throw new Error('Nieprawidłowe dane SYSTEM CLOUD: friend handle.');
 if(row.public_name!==null&&typeof row.public_name!=='string')throw new Error('Nieprawidłowe dane SYSTEM CLOUD: friend name.');
 return{...row,real_level:level};
}
export async function getCloudFriendNetwork():Promise<CloudFriendRow[]>{const s=await session();const rows=await cloudRequest<CloudFriendRow[]>('/rest/v1/rpc/get_friend_network',{method:'POST',body:'{}'},s.accessToken);return rows.map(mapFriend);}
export async function removeCloudFriend(id:string){const s=await session();await cloudRequest('/rest/v1/rpc/remove_friend',{method:'POST',body:JSON.stringify({p_target:cleanTarget(id)})},s.accessToken);}
