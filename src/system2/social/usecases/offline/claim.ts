export const OFFLINE_CLAIM_USE_CASE='offline.claim' as const;
export type OfflineClaimInput={actorId:string;targetId?:string};
export type OfflineClaimResult={ok:true}|{ok:false;code:string};
export function validateOfflineClaim(input:OfflineClaimInput):OfflineClaimResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
