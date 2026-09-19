export type RaidParticipationPolicy={enabled:boolean;limit?:number;cooldownMs?:number};
export const DEFAULT_RAID_PARTICIPATION:Readonly<RaidParticipationPolicy>={enabled:true};
export function allowsRaidParticipation(p:RaidParticipationPolicy,current=0,lastAt?:number,now=Date.now()){if(!p.enabled)return false;if(p.limit!==undefined&&current>=p.limit)return false;if(p.cooldownMs&&lastAt!==undefined&&now-lastAt<p.cooldownMs)return false;return true;}
