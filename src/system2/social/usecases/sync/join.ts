export const SYNC_JOIN_USE_CASE='sync.join' as const;
export type SyncJoinInput={actorId:string;targetId?:string};
export type SyncJoinResult={ok:true}|{ok:false;code:string};
export function validateSyncJoin(input:SyncJoinInput):SyncJoinResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
