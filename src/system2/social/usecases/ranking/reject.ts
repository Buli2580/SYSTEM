export const RANKING_REJECT_USE_CASE='ranking.reject' as const;
export type RankingRejectInput={actorId:string;targetId?:string};
export type RankingRejectResult={ok:true}|{ok:false;code:string};
export function validateRankingReject(input:RankingRejectInput):RankingRejectResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
