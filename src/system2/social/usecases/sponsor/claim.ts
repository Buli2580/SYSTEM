export const SPONSOR_CLAIM_USE_CASE='sponsor.claim' as const;
export type SponsorClaimInput={actorId:string;targetId?:string};
export type SponsorClaimResult={ok:true}|{ok:false;code:string};
export function validateSponsorClaim(input:SponsorClaimInput):SponsorClaimResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
