/** SYSTEM Network sync/events. Concrete extension seam; intentionally dependency-free. */
export const SYNC_EVENTS_MODULE='sync.events' as const;
export type SyncEventsContext={actorId:string;now:string};
export function isSyncEventsContext(v:unknown):v is SyncEventsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
