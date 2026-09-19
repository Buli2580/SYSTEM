/** SYSTEM Network feed/limits. Concrete extension seam; intentionally dependency-free. */
export const FEED_LIMITS_MODULE='feed.limits' as const;
export type FeedLimitsContext={actorId:string;now:string};
export function isFeedLimitsContext(v:unknown):v is FeedLimitsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
