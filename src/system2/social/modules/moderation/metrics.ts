/** SYSTEM Network moderation/metrics. Concrete extension seam; intentionally dependency-free. */
export const MODERATION_METRICS_MODULE='moderation.metrics' as const;
export type ModerationMetricsContext={actorId:string;now:string};
export function isModerationMetricsContext(v:unknown):v is ModerationMetricsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
