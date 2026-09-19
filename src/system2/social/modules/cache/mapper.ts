/** SYSTEM Network cache/mapper. Concrete extension seam; intentionally dependency-free. */
export const CACHE_MAPPER_MODULE='cache.mapper' as const;
export type CacheMapperContext={actorId:string;now:string};
export function isCacheMapperContext(v:unknown):v is CacheMapperContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
