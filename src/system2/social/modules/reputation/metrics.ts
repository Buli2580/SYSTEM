/** SYSTEM Network reputation/metrics. Concrete extension seam; intentionally dependency-free. */
export const REPUTATION_METRICS_MODULE='reputation.metrics' as const;
export type ReputationMetricsContext={actorId:string;now:string};
export function isReputationMetricsContext(v:unknown):v is ReputationMetricsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
