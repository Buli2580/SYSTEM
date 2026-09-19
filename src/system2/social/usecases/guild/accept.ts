export const GUILD_ACCEPT_USE_CASE='guild.accept' as const;
export type GuildAcceptInput={actorId:string;targetId?:string};
export type GuildAcceptResult={ok:true}|{ok:false;code:string};
export function validateGuildAccept(input:GuildAcceptInput):GuildAcceptResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
