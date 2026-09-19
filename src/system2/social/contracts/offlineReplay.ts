export type OfflineReplayContract={actorId:string;enabled:boolean};export const validateOfflineReplay=(v:OfflineReplayContract)=>v.actorId.trim().length>0&&v.enabled;
