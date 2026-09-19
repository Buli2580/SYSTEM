export const GUILD_VERIFY_USE_CASE='guild.verify' as const;
export type GuildVerifyInput={actorId:string;targetId?:string};
export type GuildVerifyResult={ok:true}|{ok:false;code:string};
export function validateGuildVerify(input:GuildVerifyInput):GuildVerifyResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
