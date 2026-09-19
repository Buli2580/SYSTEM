/** SYSTEM Network matchmaking/reducer. Concrete extension seam; intentionally dependency-free. */
export const MATCHMAKING_REDUCER_MODULE='matchmaking.reducer' as const;
export type MatchmakingReducerContext={actorId:string;now:string};
export function isMatchmakingReducerContext(v:unknown):v is MatchmakingReducerContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
