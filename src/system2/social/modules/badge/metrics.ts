/** SYSTEM Network badge/metrics. Concrete extension seam; intentionally dependency-free. */
export const BADGE_METRICS_MODULE='badge.metrics' as const;
export type BadgeMetricsContext={actorId:string;now:string};
export function isBadgeMetricsContext(v:unknown):v is BadgeMetricsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
