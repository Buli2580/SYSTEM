/** SYSTEM Network ranking/repository. Concrete extension seam; intentionally dependency-free. */
export const RANKING_REPOSITORY_MODULE='ranking.repository' as const;
export type RankingRepositoryContext={actorId:string;now:string};
export function isRankingRepositoryContext(v:unknown):v is RankingRepositoryContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
