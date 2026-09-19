/** SYSTEM Network matchmaking/metrics. Concrete extension seam; intentionally dependency-free. */
export const MATCHMAKING_METRICS_MODULE='matchmaking.metrics' as const;
export type MatchmakingMetricsContext={actorId:string;now:string};
export function isMatchmakingMetricsContext(v:unknown):v is MatchmakingMetricsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
