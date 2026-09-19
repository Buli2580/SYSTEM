export type SyncAccessContract={actorId:string;enabled:boolean};export const validateSyncAccess=(v:SyncAccessContract)=>v.actorId.trim().length>0&&v.enabled;
