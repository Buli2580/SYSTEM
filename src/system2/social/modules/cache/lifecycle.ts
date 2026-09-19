/** SYSTEM Network cache/lifecycle. Concrete extension seam; intentionally dependency-free. */
export const CACHE_LIFECYCLE_MODULE='cache.lifecycle' as const;
export type CacheLifecycleContext={actorId:string;now:string};
export function isCacheLifecycleContext(v:unknown):v is CacheLifecycleContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
