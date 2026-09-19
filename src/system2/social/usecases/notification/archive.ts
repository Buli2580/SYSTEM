export const NOTIFICATION_ARCHIVE_USE_CASE='notification.archive' as const;
export type NotificationArchiveInput={actorId:string;targetId?:string};
export type NotificationArchiveResult={ok:true}|{ok:false;code:string};
export function validateNotificationArchive(input:NotificationArchiveInput):NotificationArchiveResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
