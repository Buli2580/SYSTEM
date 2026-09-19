export type RaidScalingPolicy={enabled:boolean;limit?:number;cooldownMs?:number};
export const DEFAULT_RAID_SCALING:Readonly<RaidScalingPolicy>={enabled:true};
export function allowsRaidScaling(p:RaidScalingPolicy,current=0,lastAt?:number,now=Date.now()){if(!p.enabled)return false;if(p.limit!==undefined&&current>=p.limit)return false;if(p.cooldownMs&&lastAt!==undefined&&now-lastAt<p.cooldownMs)return false;return true;}
