export const SYNC_CLAIM_USE_CASE='sync.claim' as const;
export type SyncClaimInput={actorId:string;targetId?:string};
export type SyncClaimResult={ok:true}|{ok:false;code:string};
export function validateSyncClaim(input:SyncClaimInput):SyncClaimResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
