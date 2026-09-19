/** SYSTEM Network presence/metrics. Concrete extension seam; intentionally dependency-free. */
export const PRESENCE_METRICS_MODULE='presence.metrics' as const;
export type PresenceMetricsContext={actorId:string;now:string};
export function isPresenceMetricsContext(v:unknown):v is PresenceMetricsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
