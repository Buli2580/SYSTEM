export const FEED_CLAIM_USE_CASE='feed.claim' as const;
export type FeedClaimInput={actorId:string;targetId?:string};
export type FeedClaimResult={ok:true}|{ok:false;code:string};
export function validateFeedClaim(input:FeedClaimInput):FeedClaimResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
