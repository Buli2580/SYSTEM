/** SYSTEM Network notification/limits. Concrete extension seam; intentionally dependency-free. */
export const NOTIFICATION_LIMITS_MODULE='notification.limits' as const;
export type NotificationLimitsContext={actorId:string;now:string};
export function isNotificationLimitsContext(v:unknown):v is NotificationLimitsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
