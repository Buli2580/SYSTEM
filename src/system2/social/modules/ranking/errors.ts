/** SYSTEM Network ranking/errors. Concrete extension seam; intentionally dependency-free. */
export const RANKING_ERRORS_MODULE='ranking.errors' as const;
export type RankingErrorsContext={actorId:string;now:string};
export function isRankingErrorsContext(v:unknown):v is RankingErrorsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
