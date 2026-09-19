export const REPUTATION_CLAIM_USE_CASE='reputation.claim' as const;
export type ReputationClaimInput={actorId:string;targetId?:string};
export type ReputationClaimResult={ok:true}|{ok:false;code:string};
export function validateReputationClaim(input:ReputationClaimInput):ReputationClaimResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
