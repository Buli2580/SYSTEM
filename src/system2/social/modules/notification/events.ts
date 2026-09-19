/** SYSTEM Network notification/events. Concrete extension seam; intentionally dependency-free. */
export const NOTIFICATION_EVENTS_MODULE='notification.events' as const;
export type NotificationEventsContext={actorId:string;now:string};
export function isNotificationEventsContext(v:unknown):v is NotificationEventsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
