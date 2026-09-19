/** SYSTEM Network feed/service. Concrete extension seam; intentionally dependency-free. */
export const FEED_SERVICE_MODULE='feed.service' as const;
export type FeedServiceContext={actorId:string;now:string};
export function isFeedServiceContext(v:unknown):v is FeedServiceContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
