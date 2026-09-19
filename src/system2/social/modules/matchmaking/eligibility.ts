/** SYSTEM Network matchmaking/eligibility. Concrete extension seam; intentionally dependency-free. */
export const MATCHMAKING_ELIGIBILITY_MODULE='matchmaking.eligibility' as const;
export type MatchmakingEligibilityContext={actorId:string;now:string};
export function isMatchmakingEligibilityContext(v:unknown):v is MatchmakingEligibilityContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
