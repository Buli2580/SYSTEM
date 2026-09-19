/** SYSTEM Network cache/service. Concrete extension seam; intentionally dependency-free. */
export const CACHE_SERVICE_MODULE='cache.service' as const;
export type CacheServiceContext={actorId:string;now:string};
export function isCacheServiceContext(v:unknown):v is CacheServiceContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
