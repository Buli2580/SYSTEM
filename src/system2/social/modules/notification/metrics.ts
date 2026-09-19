/** SYSTEM Network notification/metrics. Concrete extension seam; intentionally dependency-free. */
export const NOTIFICATION_METRICS_MODULE='notification.metrics' as const;
export type NotificationMetricsContext={actorId:string;now:string};
export function isNotificationMetricsContext(v:unknown):v is NotificationMetricsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
