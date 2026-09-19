/** SYSTEM Network cache/selector. Concrete extension seam; intentionally dependency-free. */
export const CACHE_SELECTOR_MODULE='cache.selector' as const;
export type CacheSelectorContext={actorId:string;now:string};
export function isCacheSelectorContext(v:unknown):v is CacheSelectorContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
