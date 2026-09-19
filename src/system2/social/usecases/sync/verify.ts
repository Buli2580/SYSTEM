export const SYNC_VERIFY_USE_CASE='sync.verify' as const;
export type SyncVerifyInput={actorId:string;targetId?:string};
export type SyncVerifyResult={ok:true}|{ok:false;code:string};
export function validateSyncVerify(input:SyncVerifyInput):SyncVerifyResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
