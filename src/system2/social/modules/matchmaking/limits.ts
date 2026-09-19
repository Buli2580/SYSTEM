/** SYSTEM Network matchmaking/limits. Concrete extension seam; intentionally dependency-free. */
export const MATCHMAKING_LIMITS_MODULE='matchmaking.limits' as const;
export type MatchmakingLimitsContext={actorId:string;now:string};
export function isMatchmakingLimitsContext(v:unknown):v is MatchmakingLimitsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
