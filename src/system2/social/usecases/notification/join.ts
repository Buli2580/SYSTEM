export const NOTIFICATION_JOIN_USE_CASE='notification.join' as const;
export type NotificationJoinInput={actorId:string;targetId?:string};
export type NotificationJoinResult={ok:true}|{ok:false;code:string};
export function validateNotificationJoin(input:NotificationJoinInput):NotificationJoinResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
