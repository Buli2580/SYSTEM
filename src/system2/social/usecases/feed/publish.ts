export const FEED_PUBLISH_USE_CASE='feed.publish' as const;
export type FeedPublishInput={actorId:string;targetId?:string};
export type FeedPublishResult={ok:true}|{ok:false;code:string};
export function validateFeedPublish(input:FeedPublishInput):FeedPublishResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
