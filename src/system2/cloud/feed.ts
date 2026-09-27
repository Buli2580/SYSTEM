import {getValidSession} from './auth';
import {cloudRequest} from './http';
import type {SocialActivityEvent,SocialActivityType,SocialVisibility} from '../social/types';

type FeedRow={id:string;player_id:string;event_type:SocialActivityType;created_at:string;visibility:string;metadata:Record<string,unknown>|null};
const VISIBILITY=new Set<SocialVisibility>(['PUBLIC','FRIENDS','PRIVATE']);

export async function getActivityFeed(limit=50){
  const s=await getValidSession();if(!s)throw new Error('Najpierw zaloguj SYSTEM CLOUD.');
  const n=Math.max(1,Math.min(100,Math.floor(limit)));
  const rows=await cloudRequest<FeedRow[]>('/rest/v1/rpc/get_social_feed',{method:'POST',body:JSON.stringify({p_limit:n})},s.accessToken);
  return rows.map((row):SocialActivityEvent=>{
    const visibility=String(row.visibility).toUpperCase() as SocialVisibility;
    return{id:row.id,playerId:row.player_id,type:row.event_type,createdAt:row.created_at,visibility:VISIBILITY.has(visibility)?visibility:'PRIVATE',metadata:row.metadata??{}};
  });
}
