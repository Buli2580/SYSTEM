/** SYSTEM Network challenge/metrics. Concrete extension seam; intentionally dependency-free. */
export const CHALLENGE_METRICS_MODULE='challenge.metrics' as const;
export type ChallengeMetricsContext={actorId:string;now:string};
export function isChallengeMetricsContext(v:unknown):v is ChallengeMetricsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
