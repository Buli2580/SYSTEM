export const RIVAL_CLAIM_USE_CASE='rival.claim' as const;
export type RivalClaimInput={actorId:string;targetId?:string};
export type RivalClaimResult={ok:true}|{ok:false;code:string};
export function validateRivalClaim(input:RivalClaimInput):RivalClaimResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
