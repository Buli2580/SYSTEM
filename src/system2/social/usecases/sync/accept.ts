export const SYNC_ACCEPT_USE_CASE='sync.accept' as const;
export type SyncAcceptInput={actorId:string;targetId?:string};
export type SyncAcceptResult={ok:true}|{ok:false;code:string};
export function validateSyncAccept(input:SyncAcceptInput):SyncAcceptResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
