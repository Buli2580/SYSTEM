export const GUILD_REMOVE_USE_CASE='guild.remove' as const;
export type GuildRemoveInput={actorId:string;targetId?:string};
export type GuildRemoveResult={ok:true}|{ok:false;code:string};
export function validateGuildRemove(input:GuildRemoveInput):GuildRemoveResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
