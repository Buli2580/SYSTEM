/** SYSTEM Network rival/events. Concrete extension seam; intentionally dependency-free. */
export const RIVAL_EVENTS_MODULE='rival.events' as const;
export type RivalEventsContext={actorId:string;now:string};
export function isRivalEventsContext(v:unknown):v is RivalEventsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
