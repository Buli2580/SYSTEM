export const GUILD_LEAVE_USE_CASE='guild.leave' as const;
export type GuildLeaveInput={actorId:string;targetId?:string};
export type GuildLeaveResult={ok:true}|{ok:false;code:string};
export function validateGuildLeave(input:GuildLeaveInput):GuildLeaveResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
