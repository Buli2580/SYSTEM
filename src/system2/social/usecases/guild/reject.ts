export const GUILD_REJECT_USE_CASE='guild.reject' as const;
export type GuildRejectInput={actorId:string;targetId?:string};
export type GuildRejectResult={ok:true}|{ok:false;code:string};
export function validateGuildReject(input:GuildRejectInput):GuildRejectResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
