export const MATCHMAKING_CLAIM_USE_CASE='matchmaking.claim' as const;
export type MatchmakingClaimInput={actorId:string;targetId?:string};
export type MatchmakingClaimResult={ok:true}|{ok:false;code:string};
export function validateMatchmakingClaim(input:MatchmakingClaimInput):MatchmakingClaimResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
