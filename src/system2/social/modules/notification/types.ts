/** SYSTEM Network notification/types. Concrete extension seam; intentionally dependency-free. */
export const NOTIFICATION_TYPES_MODULE='notification.types' as const;
export type NotificationTypesContext={actorId:string;now:string};
export function isNotificationTypesContext(v:unknown):v is NotificationTypesContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
