export const SEASON_CREATE_USE_CASE='season.create' as const;
export type SeasonCreateInput={actorId:string;targetId?:string};
export type SeasonCreateResult={ok:true}|{ok:false;code:string};
export function validateSeasonCreate(input:SeasonCreateInput):SeasonCreateResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
