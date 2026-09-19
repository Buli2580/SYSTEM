/** SYSTEM Network cache/reducer. Concrete extension seam; intentionally dependency-free. */
export const CACHE_REDUCER_MODULE='cache.reducer' as const;
export type CacheReducerContext={actorId:string;now:string};
export function isCacheReducerContext(v:unknown):v is CacheReducerContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
