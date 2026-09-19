/** SYSTEM Network feed/mapper. Concrete extension seam; intentionally dependency-free. */
export const FEED_MAPPER_MODULE='feed.mapper' as const;
export type FeedMapperContext={actorId:string;now:string};
export function isFeedMapperContext(v:unknown):v is FeedMapperContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
