export type NotificationReadContract={actorId:string;enabled:boolean};export const validateNotificationRead=(v:NotificationReadContract)=>v.actorId.trim().length>0&&v.enabled;
