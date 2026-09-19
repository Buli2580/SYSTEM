/** SYSTEM Network cache/errors. Concrete extension seam; intentionally dependency-free. */
export const CACHE_ERRORS_MODULE='cache.errors' as const;
export type CacheErrorsContext={actorId:string;now:string};
export function isCacheErrorsContext(v:unknown):v is CacheErrorsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
