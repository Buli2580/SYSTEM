export const SEASON_UPDATE_USE_CASE='season.update' as const;
export type SeasonUpdateInput={actorId:string;targetId?:string};
export type SeasonUpdateResult={ok:true}|{ok:false;code:string};
export function validateSeasonUpdate(input:SeasonUpdateInput):SeasonUpdateResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
