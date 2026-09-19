/** SYSTEM Network matchmaking/state. Concrete extension seam; intentionally dependency-free. */
export const MATCHMAKING_STATE_MODULE='matchmaking.state' as const;
export type MatchmakingStateContext={actorId:string;now:string};
export function isMatchmakingStateContext(v:unknown):v is MatchmakingStateContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
