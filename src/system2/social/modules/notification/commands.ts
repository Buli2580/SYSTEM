/** SYSTEM Network notification/commands. Concrete extension seam; intentionally dependency-free. */
export const NOTIFICATION_COMMANDS_MODULE='notification.commands' as const;
export type NotificationCommandsContext={actorId:string;now:string};
export function isNotificationCommandsContext(v:unknown):v is NotificationCommandsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
