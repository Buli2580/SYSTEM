export const GUILD_CREATE_USE_CASE='guild.create' as const;
export type GuildCreateInput={actorId:string;targetId?:string};
export type GuildCreateResult={ok:true}|{ok:false;code:string};
export function validateGuildCreate(input:GuildCreateInput):GuildCreateResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
