export const SEASON_REMOVE_USE_CASE='season.remove' as const;
export type SeasonRemoveInput={actorId:string;targetId?:string};
export type SeasonRemoveResult={ok:true}|{ok:false;code:string};
export function validateSeasonRemove(input:SeasonRemoveInput):SeasonRemoveResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
