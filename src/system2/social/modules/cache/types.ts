/** SYSTEM Network cache/types. Concrete extension seam; intentionally dependency-free. */
export const CACHE_TYPES_MODULE='cache.types' as const;
export type CacheTypesContext={actorId:string;now:string};
export function isCacheTypesContext(v:unknown):v is CacheTypesContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
