export const PARTY_CLAIM_USE_CASE='party.claim' as const;
export type PartyClaimInput={actorId:string;targetId?:string};
export type PartyClaimResult={ok:true}|{ok:false;code:string};
export function validatePartyClaim(input:PartyClaimInput):PartyClaimResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
