/** SYSTEM Network notification/reducer. Concrete extension seam; intentionally dependency-free. */
export const NOTIFICATION_REDUCER_MODULE='notification.reducer' as const;
export type NotificationReducerContext={actorId:string;now:string};
export function isNotificationReducerContext(v:unknown):v is NotificationReducerContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
