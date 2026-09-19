export const SEASON_REJECT_USE_CASE='season.reject' as const;
export type SeasonRejectInput={actorId:string;targetId?:string};
export type SeasonRejectResult={ok:true}|{ok:false;code:string};
export function validateSeasonReject(input:SeasonRejectInput):SeasonRejectResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
