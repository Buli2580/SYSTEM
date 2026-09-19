/** SYSTEM Network ranking/metrics. Concrete extension seam; intentionally dependency-free. */
export const RANKING_METRICS_MODULE='ranking.metrics' as const;
export type RankingMetricsContext={actorId:string;now:string};
export function isRankingMetricsContext(v:unknown):v is RankingMetricsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
