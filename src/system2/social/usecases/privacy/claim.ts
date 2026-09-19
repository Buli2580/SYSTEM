export const PRIVACY_CLAIM_USE_CASE='privacy.claim' as const;
export type PrivacyClaimInput={actorId:string;targetId?:string};
export type PrivacyClaimResult={ok:true}|{ok:false;code:string};
export function validatePrivacyClaim(input:PrivacyClaimInput):PrivacyClaimResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
