export const NOTIFICATION_REJECT_USE_CASE='notification.reject' as const;
export type NotificationRejectInput={actorId:string;targetId?:string};
export type NotificationRejectResult={ok:true}|{ok:false;code:string};
export function validateNotificationReject(input:NotificationRejectInput):NotificationRejectResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
