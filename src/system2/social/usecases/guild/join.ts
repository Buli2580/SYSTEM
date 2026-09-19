export const GUILD_JOIN_USE_CASE='guild.join' as const;
export type GuildJoinInput={actorId:string;targetId?:string};
export type GuildJoinResult={ok:true}|{ok:false;code:string};
export function validateGuildJoin(input:GuildJoinInput):GuildJoinResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
