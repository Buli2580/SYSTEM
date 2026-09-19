/** SYSTEM Network notification/queries. Concrete extension seam; intentionally dependency-free. */
export const NOTIFICATION_QUERIES_MODULE='notification.queries' as const;
export type NotificationQueriesContext={actorId:string;now:string};
export function isNotificationQueriesContext(v:unknown):v is NotificationQueriesContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
