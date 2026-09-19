export type OfflineQueueContract={actorId:string;enabled:boolean};export const validateOfflineQueue=(v:OfflineQueueContract)=>v.actorId.trim().length>0&&v.enabled;
