export const RANKING_READ_USE_CASE='ranking.read' as const;
export type RankingReadInput={actorId:string;targetId?:string};
export type RankingReadResult={ok:true}|{ok:false;code:string};
export function validateRankingRead(input:RankingReadInput):RankingReadResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
