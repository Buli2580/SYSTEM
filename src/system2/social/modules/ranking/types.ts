/** SYSTEM Network ranking/types. Concrete extension seam; intentionally dependency-free. */
export const RANKING_TYPES_MODULE='ranking.types' as const;
export type RankingTypesContext={actorId:string;now:string};
export function isRankingTypesContext(v:unknown):v is RankingTypesContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
