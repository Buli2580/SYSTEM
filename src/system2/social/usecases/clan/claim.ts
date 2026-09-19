export const CLAN_CLAIM_USE_CASE='clan.claim' as const;
export type ClanClaimInput={actorId:string;targetId?:string};
export type ClanClaimResult={ok:true}|{ok:false;code:string};
export function validateClanClaim(input:ClanClaimInput):ClanClaimResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
