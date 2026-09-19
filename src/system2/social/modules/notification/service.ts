/** SYSTEM Network notification/service. Concrete extension seam; intentionally dependency-free. */
export const NOTIFICATION_SERVICE_MODULE='notification.service' as const;
export type NotificationServiceContext={actorId:string;now:string};
export function isNotificationServiceContext(v:unknown):v is NotificationServiceContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
