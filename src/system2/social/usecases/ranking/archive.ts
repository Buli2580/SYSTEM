export const RANKING_ARCHIVE_USE_CASE='ranking.archive' as const;
export type RankingArchiveInput={actorId:string;targetId?:string};
export type RankingArchiveResult={ok:true}|{ok:false;code:string};
export function validateRankingArchive(input:RankingArchiveInput):RankingArchiveResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
