/** SYSTEM Network cache/serializer. Concrete extension seam; intentionally dependency-free. */
export const CACHE_SERIALIZER_MODULE='cache.serializer' as const;
export type CacheSerializerContext={actorId:string;now:string};
export function isCacheSerializerContext(v:unknown):v is CacheSerializerContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
