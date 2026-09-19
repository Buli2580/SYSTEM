/** SYSTEM Network rewards/metrics. Concrete extension seam; intentionally dependency-free. */
export const REWARDS_METRICS_MODULE='rewards.metrics' as const;
export type RewardsMetricsContext={actorId:string;now:string};
export function isRewardsMetricsContext(v:unknown):v is RewardsMetricsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
