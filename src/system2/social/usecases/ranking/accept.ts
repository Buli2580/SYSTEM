export const RANKING_ACCEPT_USE_CASE='ranking.accept' as const;
export type RankingAcceptInput={actorId:string;targetId?:string};
export type RankingAcceptResult={ok:true}|{ok:false;code:string};
export function validateRankingAccept(input:RankingAcceptInput):RankingAcceptResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
