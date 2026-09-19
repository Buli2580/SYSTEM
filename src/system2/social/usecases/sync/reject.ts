export const SYNC_REJECT_USE_CASE='sync.reject' as const;
export type SyncRejectInput={actorId:string;targetId?:string};
export type SyncRejectResult={ok:true}|{ok:false;code:string};
export function validateSyncReject(input:SyncRejectInput):SyncRejectResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
