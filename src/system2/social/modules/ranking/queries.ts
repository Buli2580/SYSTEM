/** SYSTEM Network ranking/queries. Concrete extension seam; intentionally dependency-free. */
export const RANKING_QUERIES_MODULE='ranking.queries' as const;
export type RankingQueriesContext={actorId:string;now:string};
export function isRankingQueriesContext(v:unknown):v is RankingQueriesContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
