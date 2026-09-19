/** SYSTEM Network ranking/service. Concrete extension seam; intentionally dependency-free. */
export const RANKING_SERVICE_MODULE='ranking.service' as const;
export type RankingServiceContext={actorId:string;now:string};
export function isRankingServiceContext(v:unknown):v is RankingServiceContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
