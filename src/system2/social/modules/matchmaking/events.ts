/** SYSTEM Network matchmaking/events. Concrete extension seam; intentionally dependency-free. */
export const MATCHMAKING_EVENTS_MODULE='matchmaking.events' as const;
export type MatchmakingEventsContext={actorId:string;now:string};
export function isMatchmakingEventsContext(v:unknown):v is MatchmakingEventsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
