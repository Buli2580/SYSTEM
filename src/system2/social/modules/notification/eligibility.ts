/** SYSTEM Network notification/eligibility. Concrete extension seam; intentionally dependency-free. */
export const NOTIFICATION_ELIGIBILITY_MODULE='notification.eligibility' as const;
export type NotificationEligibilityContext={actorId:string;now:string};
export function isNotificationEligibilityContext(v:unknown):v is NotificationEligibilityContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
