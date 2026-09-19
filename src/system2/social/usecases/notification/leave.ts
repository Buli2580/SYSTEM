export const NOTIFICATION_LEAVE_USE_CASE='notification.leave' as const;
export type NotificationLeaveInput={actorId:string;targetId?:string};
export type NotificationLeaveResult={ok:true}|{ok:false;code:string};
export function validateNotificationLeave(input:NotificationLeaveInput):NotificationLeaveResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
