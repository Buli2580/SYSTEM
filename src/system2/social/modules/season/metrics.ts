/** SYSTEM Network season/metrics. Concrete extension seam; intentionally dependency-free. */
export const SEASON_METRICS_MODULE='season.metrics' as const;
export type SeasonMetricsContext={actorId:string;now:string};
export function isSeasonMetricsContext(v:unknown):v is SeasonMetricsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
