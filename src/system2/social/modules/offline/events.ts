/** SYSTEM Network offline/events. Concrete extension seam; intentionally dependency-free. */
export const OFFLINE_EVENTS_MODULE='offline.events' as const;
export type OfflineEventsContext={actorId:string;now:string};
export function isOfflineEventsContext(v:unknown):v is OfflineEventsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
