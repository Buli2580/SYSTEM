/** SYSTEM Network notification/serializer. Concrete extension seam; intentionally dependency-free. */
export const NOTIFICATION_SERIALIZER_MODULE='notification.serializer' as const;
export type NotificationSerializerContext={actorId:string;now:string};
export function isNotificationSerializerContext(v:unknown):v is NotificationSerializerContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
