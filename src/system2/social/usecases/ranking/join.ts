export const RANKING_JOIN_USE_CASE='ranking.join' as const;
export type RankingJoinInput={actorId:string;targetId?:string};
export type RankingJoinResult={ok:true}|{ok:false;code:string};
export function validateRankingJoin(input:RankingJoinInput):RankingJoinResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
