/** SYSTEM Network cache/eligibility. Concrete extension seam; intentionally dependency-free. */
export const CACHE_ELIGIBILITY_MODULE='cache.eligibility' as const;
export type CacheEligibilityContext={actorId:string;now:string};
export function isCacheEligibilityContext(v:unknown):v is CacheEligibilityContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
