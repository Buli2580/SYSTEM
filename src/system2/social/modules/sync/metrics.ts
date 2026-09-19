/** SYSTEM Network sync/metrics. Concrete extension seam; intentionally dependency-free. */
export const SYNC_METRICS_MODULE='sync.metrics' as const;
export type SyncMetricsContext={actorId:string;now:string};
export function isSyncMetricsContext(v:unknown):v is SyncMetricsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
