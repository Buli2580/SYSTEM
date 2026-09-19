export const SEASON_CLAIM_USE_CASE='season.claim' as const;
export type SeasonClaimInput={actorId:string;targetId?:string};
export type SeasonClaimResult={ok:true}|{ok:false;code:string};
export function validateSeasonClaim(input:SeasonClaimInput):SeasonClaimResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
