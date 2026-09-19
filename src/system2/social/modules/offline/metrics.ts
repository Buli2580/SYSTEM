/** SYSTEM Network offline/metrics. Concrete extension seam; intentionally dependency-free. */
export const OFFLINE_METRICS_MODULE='offline.metrics' as const;
export type OfflineMetricsContext={actorId:string;now:string};
export function isOfflineMetricsContext(v:unknown):v is OfflineMetricsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
