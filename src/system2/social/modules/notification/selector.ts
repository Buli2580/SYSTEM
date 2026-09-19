/** SYSTEM Network notification/selector. Concrete extension seam; intentionally dependency-free. */
export const NOTIFICATION_SELECTOR_MODULE='notification.selector' as const;
export type NotificationSelectorContext={actorId:string;now:string};
export function isNotificationSelectorContext(v:unknown):v is NotificationSelectorContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
