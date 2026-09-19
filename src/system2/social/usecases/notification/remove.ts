export const NOTIFICATION_REMOVE_USE_CASE='notification.remove' as const;
export type NotificationRemoveInput={actorId:string;targetId?:string};
export type NotificationRemoveResult={ok:true}|{ok:false;code:string};
export function validateNotificationRemove(input:NotificationRemoveInput):NotificationRemoveResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
