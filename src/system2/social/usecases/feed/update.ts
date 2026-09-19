export const FEED_UPDATE_USE_CASE='feed.update' as const;
export type FeedUpdateInput={actorId:string;targetId?:string};
export type FeedUpdateResult={ok:true}|{ok:false;code:string};
export function validateFeedUpdate(input:FeedUpdateInput):FeedUpdateResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
