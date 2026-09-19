export const SEASON_ACCEPT_USE_CASE='season.accept' as const;
export type SeasonAcceptInput={actorId:string;targetId?:string};
export type SeasonAcceptResult={ok:true}|{ok:false;code:string};
export function validateSeasonAccept(input:SeasonAcceptInput):SeasonAcceptResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
