export const RANKING_REMOVE_USE_CASE='ranking.remove' as const;
export type RankingRemoveInput={actorId:string;targetId?:string};
export type RankingRemoveResult={ok:true}|{ok:false;code:string};
export function validateRankingRemove(input:RankingRemoveInput):RankingRemoveResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
