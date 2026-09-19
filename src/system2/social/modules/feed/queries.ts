/** SYSTEM Network feed/queries. Concrete extension seam; intentionally dependency-free. */
export const FEED_QUERIES_MODULE='feed.queries' as const;
export type FeedQueriesContext={actorId:string;now:string};
export function isFeedQueriesContext(v:unknown):v is FeedQueriesContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
