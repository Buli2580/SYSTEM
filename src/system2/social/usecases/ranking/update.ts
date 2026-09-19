export const RANKING_UPDATE_USE_CASE='ranking.update' as const;
export type RankingUpdateInput={actorId:string;targetId?:string};
export type RankingUpdateResult={ok:true}|{ok:false;code:string};
export function validateRankingUpdate(input:RankingUpdateInput):RankingUpdateResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
