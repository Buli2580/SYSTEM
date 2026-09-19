export const RANKING_CLAIM_USE_CASE='ranking.claim' as const;
export type RankingClaimInput={actorId:string;targetId?:string};
export type RankingClaimResult={ok:true}|{ok:false;code:string};
export function validateRankingClaim(input:RankingClaimInput):RankingClaimResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
