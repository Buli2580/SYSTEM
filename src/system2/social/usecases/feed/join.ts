export const FEED_JOIN_USE_CASE='feed.join' as const;
export type FeedJoinInput={actorId:string;targetId?:string};
export type FeedJoinResult={ok:true}|{ok:false;code:string};
export function validateFeedJoin(input:FeedJoinInput):FeedJoinResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
