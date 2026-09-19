/** SYSTEM Network matchmaking/types. Concrete extension seam; intentionally dependency-free. */
export const MATCHMAKING_TYPES_MODULE='matchmaking.types' as const;
export type MatchmakingTypesContext={actorId:string;now:string};
export function isMatchmakingTypesContext(v:unknown):v is MatchmakingTypesContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
