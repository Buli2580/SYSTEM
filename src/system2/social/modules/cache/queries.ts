/** SYSTEM Network cache/queries. Concrete extension seam; intentionally dependency-free. */
export const CACHE_QUERIES_MODULE='cache.queries' as const;
export type CacheQueriesContext={actorId:string;now:string};
export function isCacheQueriesContext(v:unknown):v is CacheQueriesContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
