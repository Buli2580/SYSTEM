export type GuildLeavePolicyPolicy={enabled:boolean;limit?:number;cooldownMs?:number};
export const DEFAULT_GUILD_LEAVE_POLICY:Readonly<GuildLeavePolicyPolicy>={enabled:true};
export function allowsGuildLeavePolicy(p:GuildLeavePolicyPolicy,current=0,lastAt?:number,now=Date.now()){if(!p.enabled)return false;if(p.limit!==undefined&&current>=p.limit)return false;if(p.cooldownMs&&lastAt!==undefined&&now-lastAt<p.cooldownMs)return false;return true;}
