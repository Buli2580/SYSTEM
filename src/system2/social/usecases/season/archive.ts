export const SEASON_ARCHIVE_USE_CASE='season.archive' as const;
export type SeasonArchiveInput={actorId:string;targetId?:string};
export type SeasonArchiveResult={ok:true}|{ok:false;code:string};
export function validateSeasonArchive(input:SeasonArchiveInput):SeasonArchiveResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
