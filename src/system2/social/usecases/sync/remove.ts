export const SYNC_REMOVE_USE_CASE='sync.remove' as const;
export type SyncRemoveInput={actorId:string;targetId?:string};
export type SyncRemoveResult={ok:true}|{ok:false;code:string};
export function validateSyncRemove(input:SyncRemoveInput):SyncRemoveResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
