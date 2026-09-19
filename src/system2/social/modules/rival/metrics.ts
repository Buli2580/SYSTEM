/** SYSTEM Network rival/metrics. Concrete extension seam; intentionally dependency-free. */
export const RIVAL_METRICS_MODULE='rival.metrics' as const;
export type RivalMetricsContext={actorId:string;now:string};
export function isRivalMetricsContext(v:unknown):v is RivalMetricsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
