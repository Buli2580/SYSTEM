export type OfflineAccessContract={actorId:string;enabled:boolean};export const validateOfflineAccess=(v:OfflineAccessContract)=>v.actorId.trim().length>0&&v.enabled;
