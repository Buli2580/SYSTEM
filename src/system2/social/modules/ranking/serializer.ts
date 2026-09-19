/** SYSTEM Network ranking/serializer. Concrete extension seam; intentionally dependency-free. */
export const RANKING_SERIALIZER_MODULE='ranking.serializer' as const;
export type RankingSerializerContext={actorId:string;now:string};
export function isRankingSerializerContext(v:unknown):v is RankingSerializerContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
