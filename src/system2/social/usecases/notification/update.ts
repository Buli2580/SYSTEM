export const NOTIFICATION_UPDATE_USE_CASE='notification.update' as const;
export type NotificationUpdateInput={actorId:string;targetId?:string};
export type NotificationUpdateResult={ok:true}|{ok:false;code:string};
export function validateNotificationUpdate(input:NotificationUpdateInput):NotificationUpdateResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
