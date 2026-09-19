/** SYSTEM Network ranking/eligibility. Concrete extension seam; intentionally dependency-free. */
export const RANKING_ELIGIBILITY_MODULE='ranking.eligibility' as const;
export type RankingEligibilityContext={actorId:string;now:string};
export function isRankingEligibilityContext(v:unknown):v is RankingEligibilityContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
