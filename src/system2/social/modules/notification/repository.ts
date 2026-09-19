/** SYSTEM Network notification/repository. Concrete extension seam; intentionally dependency-free. */
export const NOTIFICATION_REPOSITORY_MODULE='notification.repository' as const;
export type NotificationRepositoryContext={actorId:string;now:string};
export function isNotificationRepositoryContext(v:unknown):v is NotificationRepositoryContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
