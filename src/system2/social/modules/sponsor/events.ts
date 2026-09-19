/** SYSTEM Network sponsor/events. Concrete extension seam; intentionally dependency-free. */
export const SPONSOR_EVENTS_MODULE='sponsor.events' as const;
export type SponsorEventsContext={actorId:string;now:string};
export function isSponsorEventsContext(v:unknown):v is SponsorEventsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
