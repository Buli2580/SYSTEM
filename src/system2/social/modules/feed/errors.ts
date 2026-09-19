/** SYSTEM Network feed/errors. Concrete extension seam; intentionally dependency-free. */
export const FEED_ERRORS_MODULE='feed.errors' as const;
export type FeedErrorsContext={actorId:string;now:string};
export function isFeedErrorsContext(v:unknown):v is FeedErrorsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
