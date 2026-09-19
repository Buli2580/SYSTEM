/** SYSTEM Network feed/reducer. Concrete extension seam; intentionally dependency-free. */
export const FEED_REDUCER_MODULE='feed.reducer' as const;
export type FeedReducerContext={actorId:string;now:string};
export function isFeedReducerContext(v:unknown):v is FeedReducerContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
