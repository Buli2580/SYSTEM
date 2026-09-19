export const SEASON_READ_USE_CASE='season.read' as const;
export type SeasonReadInput={actorId:string;targetId?:string};
export type SeasonReadResult={ok:true}|{ok:false;code:string};
export function validateSeasonRead(input:SeasonReadInput):SeasonReadResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
