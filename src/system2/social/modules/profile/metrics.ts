/** SYSTEM Network profile/metrics. Concrete extension seam; intentionally dependency-free. */
export const PROFILE_METRICS_MODULE='profile.metrics' as const;
export type ProfileMetricsContext={actorId:string;now:string};
export function isProfileMetricsContext(v:unknown):v is ProfileMetricsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
