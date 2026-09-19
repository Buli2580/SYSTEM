export const SYNC_UPDATE_USE_CASE='sync.update' as const;
export type SyncUpdateInput={actorId:string;targetId?:string};
export type SyncUpdateResult={ok:true}|{ok:false;code:string};
export function validateSyncUpdate(input:SyncUpdateInput):SyncUpdateResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
