/** SYSTEM Network raid/events. Concrete extension seam; intentionally dependency-free. */
export const RAID_EVENTS_MODULE='raid.events' as const;
export type RaidEventsContext={actorId:string;now:string};
export function isRaidEventsContext(v:unknown):v is RaidEventsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
