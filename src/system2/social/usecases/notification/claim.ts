export const NOTIFICATION_CLAIM_USE_CASE='notification.claim' as const;
export type NotificationClaimInput={actorId:string;targetId?:string};
export type NotificationClaimResult={ok:true}|{ok:false;code:string};
export function validateNotificationClaim(input:NotificationClaimInput):NotificationClaimResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
