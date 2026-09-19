export const SYNC_CREATE_USE_CASE='sync.create' as const;
export type SyncCreateInput={actorId:string;targetId?:string};
export type SyncCreateResult={ok:true}|{ok:false;code:string};
export function validateSyncCreate(input:SyncCreateInput):SyncCreateResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
