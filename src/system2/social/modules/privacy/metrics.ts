/** SYSTEM Network privacy/metrics. Concrete extension seam; intentionally dependency-free. */
export const PRIVACY_METRICS_MODULE='privacy.metrics' as const;
export type PrivacyMetricsContext={actorId:string;now:string};
export function isPrivacyMetricsContext(v:unknown):v is PrivacyMetricsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
