/** SYSTEM Network security/metrics. Concrete extension seam; intentionally dependency-free. */
export const SECURITY_METRICS_MODULE='security.metrics' as const;
export type SecurityMetricsContext={actorId:string;now:string};
export function isSecurityMetricsContext(v:unknown):v is SecurityMetricsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
