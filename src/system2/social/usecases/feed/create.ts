export const FEED_CREATE_USE_CASE='feed.create' as const;
export type FeedCreateInput={actorId:string;targetId?:string};
export type FeedCreateResult={ok:true}|{ok:false;code:string};
export function validateFeedCreate(input:FeedCreateInput):FeedCreateResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
