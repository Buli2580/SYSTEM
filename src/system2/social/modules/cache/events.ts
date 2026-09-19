/** SYSTEM Network cache/events. Concrete extension seam; intentionally dependency-free. */
export const CACHE_EVENTS_MODULE='cache.events' as const;
export type CacheEventsContext={actorId:string;now:string};
export function isCacheEventsContext(v:unknown):v is CacheEventsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
