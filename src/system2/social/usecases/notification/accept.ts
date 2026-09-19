export const NOTIFICATION_ACCEPT_USE_CASE='notification.accept' as const;
export type NotificationAcceptInput={actorId:string;targetId?:string};
export type NotificationAcceptResult={ok:true}|{ok:false;code:string};
export function validateNotificationAccept(input:NotificationAcceptInput):NotificationAcceptResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
