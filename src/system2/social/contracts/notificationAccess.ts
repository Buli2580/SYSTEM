export type NotificationAccessContract={actorId:string;enabled:boolean};export const validateNotificationAccess=(v:NotificationAccessContract)=>v.actorId.trim().length>0&&v.enabled;
