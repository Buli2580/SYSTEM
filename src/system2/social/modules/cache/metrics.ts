/** SYSTEM Network cache/metrics. Concrete extension seam; intentionally dependency-free. */
export const CACHE_METRICS_MODULE='cache.metrics' as const;
export type CacheMetricsContext={actorId:string;now:string};
export function isCacheMetricsContext(v:unknown):v is CacheMetricsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
