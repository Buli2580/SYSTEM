/** SYSTEM Network cache/state. Concrete extension seam; intentionally dependency-free. */
export const CACHE_STATE_MODULE='cache.state' as const;
export type CacheStateContext={actorId:string;now:string};
export function isCacheStateContext(v:unknown):v is CacheStateContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
