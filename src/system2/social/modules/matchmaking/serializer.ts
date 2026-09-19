/** SYSTEM Network matchmaking/serializer. Concrete extension seam; intentionally dependency-free. */
export const MATCHMAKING_SERIALIZER_MODULE='matchmaking.serializer' as const;
export type MatchmakingSerializerContext={actorId:string;now:string};
export function isMatchmakingSerializerContext(v:unknown):v is MatchmakingSerializerContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
