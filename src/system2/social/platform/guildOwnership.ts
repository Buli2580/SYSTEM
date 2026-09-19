export type GuildOwnershipPolicy={enabled:boolean;limit?:number;cooldownMs?:number};
export const DEFAULT_GUILD_OWNERSHIP:Readonly<GuildOwnershipPolicy>={enabled:true};
export function allowsGuildOwnership(p:GuildOwnershipPolicy,current=0,lastAt?:number,now=Date.now()){if(!p.enabled)return false;if(p.limit!==undefined&&current>=p.limit)return false;if(p.cooldownMs&&lastAt!==undefined&&now-lastAt<p.cooldownMs)return false;return true;}
