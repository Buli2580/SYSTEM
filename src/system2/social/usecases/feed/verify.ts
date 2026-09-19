export const FEED_VERIFY_USE_CASE='feed.verify' as const;
export type FeedVerifyInput={actorId:string;targetId?:string};
export type FeedVerifyResult={ok:true}|{ok:false;code:string};
export function validateFeedVerify(input:FeedVerifyInput):FeedVerifyResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
