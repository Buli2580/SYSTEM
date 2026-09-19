export type SyncConflictContract={actorId:string;enabled:boolean};export const validateSyncConflict=(v:SyncConflictContract)=>v.actorId.trim().length>0&&v.enabled;
