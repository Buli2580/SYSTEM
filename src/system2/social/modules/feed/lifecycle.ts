/** SYSTEM Network feed/lifecycle. Concrete extension seam; intentionally dependency-free. */
export const FEED_LIFECYCLE_MODULE='feed.lifecycle' as const;
export type FeedLifecycleContext={actorId:string;now:string};
export function isFeedLifecycleContext(v:unknown):v is FeedLifecycleContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
