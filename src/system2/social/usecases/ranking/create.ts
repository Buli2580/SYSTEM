export const RANKING_CREATE_USE_CASE='ranking.create' as const;
export type RankingCreateInput={actorId:string;targetId?:string};
export type RankingCreateResult={ok:true}|{ok:false;code:string};
export function validateRankingCreate(input:RankingCreateInput):RankingCreateResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
