export const RANKING_LEAVE_USE_CASE='ranking.leave' as const;
export type RankingLeaveInput={actorId:string;targetId?:string};
export type RankingLeaveResult={ok:true}|{ok:false;code:string};
export function validateRankingLeave(input:RankingLeaveInput):RankingLeaveResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
