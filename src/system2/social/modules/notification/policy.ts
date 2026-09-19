/** SYSTEM Network notification/policy. Concrete extension seam; intentionally dependency-free. */
export const NOTIFICATION_POLICY_MODULE='notification.policy' as const;
export type NotificationPolicyContext={actorId:string;now:string};
export function isNotificationPolicyContext(v:unknown):v is NotificationPolicyContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
