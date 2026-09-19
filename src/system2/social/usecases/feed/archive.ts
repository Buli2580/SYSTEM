export const FEED_ARCHIVE_USE_CASE='feed.archive' as const;
export type FeedArchiveInput={actorId:string;targetId?:string};
export type FeedArchiveResult={ok:true}|{ok:false;code:string};
export function validateFeedArchive(input:FeedArchiveInput):FeedArchiveResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
