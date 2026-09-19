export const FEED_REJECT_USE_CASE='feed.reject' as const;
export type FeedRejectInput={actorId:string;targetId?:string};
export type FeedRejectResult={ok:true}|{ok:false;code:string};
export function validateFeedReject(input:FeedRejectInput):FeedRejectResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
