export const SEASON_JOIN_USE_CASE='season.join' as const;
export type SeasonJoinInput={actorId:string;targetId?:string};
export type SeasonJoinResult={ok:true}|{ok:false;code:string};
export function validateSeasonJoin(input:SeasonJoinInput):SeasonJoinResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
