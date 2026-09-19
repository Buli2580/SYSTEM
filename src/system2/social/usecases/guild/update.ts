export const GUILD_UPDATE_USE_CASE='guild.update' as const;
export type GuildUpdateInput={actorId:string;targetId?:string};
export type GuildUpdateResult={ok:true}|{ok:false;code:string};
export function validateGuildUpdate(input:GuildUpdateInput):GuildUpdateResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
