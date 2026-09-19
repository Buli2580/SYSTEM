/** SYSTEM Network ranking/events. Concrete extension seam; intentionally dependency-free. */
export const RANKING_EVENTS_MODULE='ranking.events' as const;
export type RankingEventsContext={actorId:string;now:string};
export function isRankingEventsContext(v:unknown):v is RankingEventsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
