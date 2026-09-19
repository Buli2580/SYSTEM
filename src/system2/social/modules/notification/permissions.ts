/** SYSTEM Network notification/permissions. Concrete extension seam; intentionally dependency-free. */
export const NOTIFICATION_PERMISSIONS_MODULE='notification.permissions' as const;
export type NotificationPermissionsContext={actorId:string;now:string};
export function isNotificationPermissionsContext(v:unknown):v is NotificationPermissionsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
