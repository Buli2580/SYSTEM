export const CLAN_ARCHIVE_USE_CASE='clan.archive' as const;
export type ClanArchiveInput={actorId:string;targetId?:string};
export type ClanArchiveResult={ok:true}|{ok:false;code:string};
export function validateClanArchive(input:ClanArchiveInput):ClanArchiveResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
