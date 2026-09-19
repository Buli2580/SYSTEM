export const RAID_ARCHIVE_USE_CASE='raid.archive' as const;
export type RaidArchiveInput={actorId:string;targetId?:string};
export type RaidArchiveResult={ok:true}|{ok:false;code:string};
export function validateRaidArchive(input:RaidArchiveInput):RaidArchiveResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
