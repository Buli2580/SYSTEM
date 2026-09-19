export const GUILD_ARCHIVE_USE_CASE='guild.archive' as const;
export type GuildArchiveInput={actorId:string;targetId?:string};
export type GuildArchiveResult={ok:true}|{ok:false;code:string};
export function validateGuildArchive(input:GuildArchiveInput):GuildArchiveResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
