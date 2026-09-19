/** SYSTEM Network cache/validator. Concrete extension seam; intentionally dependency-free. */
export const CACHE_VALIDATOR_MODULE='cache.validator' as const;
export type CacheValidatorContext={actorId:string;now:string};
export function isCacheValidatorContext(v:unknown):v is CacheValidatorContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
