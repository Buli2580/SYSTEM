/** SYSTEM Network cache/limits. Concrete extension seam; intentionally dependency-free. */
export const CACHE_LIMITS_MODULE='cache.limits' as const;
export type CacheLimitsContext={actorId:string;now:string};
export function isCacheLimitsContext(v:unknown):v is CacheLimitsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
