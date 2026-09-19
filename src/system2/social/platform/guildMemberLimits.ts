export type GuildMemberLimitsPolicy={enabled:boolean;limit?:number;cooldownMs?:number};
export const DEFAULT_GUILD_MEMBER_LIMITS:Readonly<GuildMemberLimitsPolicy>={enabled:true};
export function allowsGuildMemberLimits(p:GuildMemberLimitsPolicy,current=0,lastAt?:number,now=Date.now()){if(!p.enabled)return false;if(p.limit!==undefined&&current>=p.limit)return false;if(p.cooldownMs&&lastAt!==undefined&&now-lastAt<p.cooldownMs)return false;return true;}
