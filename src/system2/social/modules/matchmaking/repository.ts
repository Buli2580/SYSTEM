/** SYSTEM Network matchmaking/repository. Concrete extension seam; intentionally dependency-free. */
export const MATCHMAKING_REPOSITORY_MODULE='matchmaking.repository' as const;
export type MatchmakingRepositoryContext={actorId:string;now:string};
export function isMatchmakingRepositoryContext(v:unknown):v is MatchmakingRepositoryContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
