/** SYSTEM Network matchmaking/mapper. Concrete extension seam; intentionally dependency-free. */
export const MATCHMAKING_MAPPER_MODULE='matchmaking.mapper' as const;
export type MatchmakingMapperContext={actorId:string;now:string};
export function isMatchmakingMapperContext(v:unknown):v is MatchmakingMapperContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
