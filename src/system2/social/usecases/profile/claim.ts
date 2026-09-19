export const PROFILE_CLAIM_USE_CASE='profile.claim' as const;
export type ProfileClaimInput={actorId:string;targetId?:string};
export type ProfileClaimResult={ok:true}|{ok:false;code:string};
export function validateProfileClaim(input:ProfileClaimInput):ProfileClaimResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
