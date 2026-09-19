/** SYSTEM Network notification/audit. Concrete extension seam; intentionally dependency-free. */
export const NOTIFICATION_AUDIT_MODULE='notification.audit' as const;
export type NotificationAuditContext={actorId:string;now:string};
export function isNotificationAuditContext(v:unknown):v is NotificationAuditContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
