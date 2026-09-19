/** SYSTEM Network notification/lifecycle. Concrete extension seam; intentionally dependency-free. */
export const NOTIFICATION_LIFECYCLE_MODULE='notification.lifecycle' as const;
export type NotificationLifecycleContext={actorId:string;now:string};
export function isNotificationLifecycleContext(v:unknown):v is NotificationLifecycleContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
