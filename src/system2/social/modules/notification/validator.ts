/** SYSTEM Network notification/validator. Concrete extension seam; intentionally dependency-free. */
export const NOTIFICATION_VALIDATOR_MODULE='notification.validator' as const;
export type NotificationValidatorContext={actorId:string;now:string};
export function isNotificationValidatorContext(v:unknown):v is NotificationValidatorContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
