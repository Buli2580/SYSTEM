export const NOTIFICATION_CREATE_USE_CASE='notification.create' as const;
export type NotificationCreateInput={actorId:string;targetId?:string};
export type NotificationCreateResult={ok:true}|{ok:false;code:string};
export function validateNotificationCreate(input:NotificationCreateInput):NotificationCreateResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
