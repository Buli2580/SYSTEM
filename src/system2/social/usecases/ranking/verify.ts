export const RANKING_VERIFY_USE_CASE='ranking.verify' as const;
export type RankingVerifyInput={actorId:string;targetId?:string};
export type RankingVerifyResult={ok:true}|{ok:false;code:string};
export function validateRankingVerify(input:RankingVerifyInput):RankingVerifyResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
