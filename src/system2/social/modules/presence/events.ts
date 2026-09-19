/** SYSTEM Network presence/events. Concrete extension seam; intentionally dependency-free. */
export const PRESENCE_EVENTS_MODULE='presence.events' as const;
export type PresenceEventsContext={actorId:string;now:string};
export function isPresenceEventsContext(v:unknown):v is PresenceEventsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
