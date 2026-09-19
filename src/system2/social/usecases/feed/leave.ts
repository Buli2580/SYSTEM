export const FEED_LEAVE_USE_CASE='feed.leave' as const;
export type FeedLeaveInput={actorId:string;targetId?:string};
export type FeedLeaveResult={ok:true}|{ok:false;code:string};
export function validateFeedLeave(input:FeedLeaveInput):FeedLeaveResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
