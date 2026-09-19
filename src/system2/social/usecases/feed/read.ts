export const FEED_READ_USE_CASE='feed.read' as const;
export type FeedReadInput={actorId:string;targetId?:string};
export type FeedReadResult={ok:true}|{ok:false;code:string};
export function validateFeedRead(input:FeedReadInput):FeedReadResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
