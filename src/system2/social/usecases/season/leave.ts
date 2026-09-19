export const SEASON_LEAVE_USE_CASE='season.leave' as const;
export type SeasonLeaveInput={actorId:string;targetId?:string};
export type SeasonLeaveResult={ok:true}|{ok:false;code:string};
export function validateSeasonLeave(input:SeasonLeaveInput):SeasonLeaveResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
