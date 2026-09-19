/** SYSTEM Network matchmaking/errors. Concrete extension seam; intentionally dependency-free. */
export const MATCHMAKING_ERRORS_MODULE='matchmaking.errors' as const;
export type MatchmakingErrorsContext={actorId:string;now:string};
export function isMatchmakingErrorsContext(v:unknown):v is MatchmakingErrorsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
