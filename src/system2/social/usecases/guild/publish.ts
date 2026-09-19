export const GUILD_PUBLISH_USE_CASE='guild.publish' as const;
export type GuildPublishInput={actorId:string;targetId?:string};
export type GuildPublishResult={ok:true}|{ok:false;code:string};
export function validateGuildPublish(input:GuildPublishInput):GuildPublishResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
