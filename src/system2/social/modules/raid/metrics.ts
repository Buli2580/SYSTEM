/** SYSTEM Network raid/metrics. Concrete extension seam; intentionally dependency-free. */
export const RAID_METRICS_MODULE='raid.metrics' as const;
export type RaidMetricsContext={actorId:string;now:string};
export function isRaidMetricsContext(v:unknown):v is RaidMetricsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
