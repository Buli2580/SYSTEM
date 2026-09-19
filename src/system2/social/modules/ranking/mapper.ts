/** SYSTEM Network ranking/mapper. Concrete extension seam; intentionally dependency-free. */
export const RANKING_MAPPER_MODULE='ranking.mapper' as const;
export type RankingMapperContext={actorId:string;now:string};
export function isRankingMapperContext(v:unknown):v is RankingMapperContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
