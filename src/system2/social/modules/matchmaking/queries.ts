/** SYSTEM Network matchmaking/queries. Concrete extension seam; intentionally dependency-free. */
export const MATCHMAKING_QUERIES_MODULE='matchmaking.queries' as const;
export type MatchmakingQueriesContext={actorId:string;now:string};
export function isMatchmakingQueriesContext(v:unknown):v is MatchmakingQueriesContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
