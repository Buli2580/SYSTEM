/** SYSTEM Network ranking/limits. Concrete extension seam; intentionally dependency-free. */
export const RANKING_LIMITS_MODULE='ranking.limits' as const;
export type RankingLimitsContext={actorId:string;now:string};
export function isRankingLimitsContext(v:unknown):v is RankingLimitsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
