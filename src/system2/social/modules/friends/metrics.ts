/** SYSTEM Network friends/metrics. Concrete extension seam; intentionally dependency-free. */
export const FRIENDS_METRICS_MODULE='friends.metrics' as const;
export type FriendsMetricsContext={actorId:string;now:string};
export function isFriendsMetricsContext(v:unknown):v is FriendsMetricsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
