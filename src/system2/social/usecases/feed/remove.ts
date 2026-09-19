export const FEED_REMOVE_USE_CASE='feed.remove' as const;
export type FeedRemoveInput={actorId:string;targetId?:string};
export type FeedRemoveResult={ok:true}|{ok:false;code:string};
export function validateFeedRemove(input:FeedRemoveInput):FeedRemoveResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
