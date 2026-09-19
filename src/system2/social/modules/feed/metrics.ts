/** SYSTEM Network feed/metrics. Concrete extension seam; intentionally dependency-free. */
export const FEED_METRICS_MODULE='feed.metrics' as const;
export type FeedMetricsContext={actorId:string;now:string};
export function isFeedMetricsContext(v:unknown):v is FeedMetricsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
