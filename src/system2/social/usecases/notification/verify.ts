export const NOTIFICATION_VERIFY_USE_CASE='notification.verify' as const;
export type NotificationVerifyInput={actorId:string;targetId?:string};
export type NotificationVerifyResult={ok:true}|{ok:false;code:string};
export function validateNotificationVerify(input:NotificationVerifyInput):NotificationVerifyResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
