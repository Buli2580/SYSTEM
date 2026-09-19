/** SYSTEM Network feed/serializer. Concrete extension seam; intentionally dependency-free. */
export const FEED_SERIALIZER_MODULE='feed.serializer' as const;
export type FeedSerializerContext={actorId:string;now:string};
export function isFeedSerializerContext(v:unknown):v is FeedSerializerContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
