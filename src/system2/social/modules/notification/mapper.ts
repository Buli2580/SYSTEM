/** SYSTEM Network notification/mapper. Concrete extension seam; intentionally dependency-free. */
export const NOTIFICATION_MAPPER_MODULE='notification.mapper' as const;
export type NotificationMapperContext={actorId:string;now:string};
export function isNotificationMapperContext(v:unknown):v is NotificationMapperContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
