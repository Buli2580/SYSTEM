/** SYSTEM Network feed/repository. Concrete extension seam; intentionally dependency-free. */
export const FEED_REPOSITORY_MODULE='feed.repository' as const;
export type FeedRepositoryContext={actorId:string;now:string};
export function isFeedRepositoryContext(v:unknown):v is FeedRepositoryContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
