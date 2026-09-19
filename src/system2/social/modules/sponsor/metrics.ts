/** SYSTEM Network sponsor/metrics. Concrete extension seam; intentionally dependency-free. */
export const SPONSOR_METRICS_MODULE='sponsor.metrics' as const;
export type SponsorMetricsContext={actorId:string;now:string};
export function isSponsorMetricsContext(v:unknown):v is SponsorMetricsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
