/** SYSTEM Network notification/errors. Concrete extension seam; intentionally dependency-free. */
export const NOTIFICATION_ERRORS_MODULE='notification.errors' as const;
export type NotificationErrorsContext={actorId:string;now:string};
export function isNotificationErrorsContext(v:unknown):v is NotificationErrorsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
