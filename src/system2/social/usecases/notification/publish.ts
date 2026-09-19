export const NOTIFICATION_PUBLISH_USE_CASE='notification.publish' as const;
export type NotificationPublishInput={actorId:string;targetId?:string};
export type NotificationPublishResult={ok:true}|{ok:false;code:string};
export function validateNotificationPublish(input:NotificationPublishInput):NotificationPublishResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
