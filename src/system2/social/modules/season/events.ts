/** SYSTEM Network season/events. Concrete extension seam; intentionally dependency-free. */
export const SEASON_EVENTS_MODULE='season.events' as const;
export type SeasonEventsContext={actorId:string;now:string};
export function isSeasonEventsContext(v:unknown):v is SeasonEventsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
