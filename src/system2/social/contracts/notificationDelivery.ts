export type NotificationDeliveryContract={actorId:string;enabled:boolean};export const validateNotificationDelivery=(v:NotificationDeliveryContract)=>v.actorId.trim().length>0&&v.enabled;
