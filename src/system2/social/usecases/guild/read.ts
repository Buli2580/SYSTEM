export const GUILD_READ_USE_CASE='guild.read' as const;
export type GuildReadInput={actorId:string;targetId?:string};
export type GuildReadResult={ok:true}|{ok:false;code:string};
export function validateGuildRead(input:GuildReadInput):GuildReadResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
