export const FEED_ACCEPT_USE_CASE='feed.accept' as const;
export type FeedAcceptInput={actorId:string;targetId?:string};
export type FeedAcceptResult={ok:true}|{ok:false;code:string};
export function validateFeedAccept(input:FeedAcceptInput):FeedAcceptResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
