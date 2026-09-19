/** SYSTEM Network discovery/metrics. Concrete extension seam; intentionally dependency-free. */
export const DISCOVERY_METRICS_MODULE='discovery.metrics' as const;
export type DiscoveryMetricsContext={actorId:string;now:string};
export function isDiscoveryMetricsContext(v:unknown):v is DiscoveryMetricsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
