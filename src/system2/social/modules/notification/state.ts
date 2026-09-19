/** SYSTEM Network notification/state. Concrete extension seam; intentionally dependency-free. */
export const NOTIFICATION_STATE_MODULE='notification.state' as const;
export type NotificationStateContext={actorId:string;now:string};
export function isNotificationStateContext(v:unknown):v is NotificationStateContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
