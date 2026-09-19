/** SYSTEM Network feed/state. Concrete extension seam; intentionally dependency-free. */
export const FEED_STATE_MODULE='feed.state' as const;
export type FeedStateContext={actorId:string;now:string};
export function isFeedStateContext(v:unknown):v is FeedStateContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
