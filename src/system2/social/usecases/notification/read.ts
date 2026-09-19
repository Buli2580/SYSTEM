export const NOTIFICATION_READ_USE_CASE='notification.read' as const;
export type NotificationReadInput={actorId:string;targetId?:string};
export type NotificationReadResult={ok:true}|{ok:false;code:string};
export function validateNotificationRead(input:NotificationReadInput):NotificationReadResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
