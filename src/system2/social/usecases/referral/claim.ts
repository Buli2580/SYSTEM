export const REFERRAL_CLAIM_USE_CASE='referral.claim' as const;
export type ReferralClaimInput={actorId:string;targetId?:string};
export type ReferralClaimResult={ok:true}|{ok:false;code:string};
export function validateReferralClaim(input:ReferralClaimInput):ReferralClaimResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
