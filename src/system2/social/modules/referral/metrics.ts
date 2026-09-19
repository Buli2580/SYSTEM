/** SYSTEM Network referral/metrics. Concrete extension seam; intentionally dependency-free. */
export const REFERRAL_METRICS_MODULE='referral.metrics' as const;
export type ReferralMetricsContext={actorId:string;now:string};
export function isReferralMetricsContext(v:unknown):v is ReferralMetricsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
