/** SYSTEM Network matchmaking/service. Concrete extension seam; intentionally dependency-free. */
export const MATCHMAKING_SERVICE_MODULE='matchmaking.service' as const;
export type MatchmakingServiceContext={actorId:string;now:string};
export function isMatchmakingServiceContext(v:unknown):v is MatchmakingServiceContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
