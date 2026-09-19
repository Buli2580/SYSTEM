export type RaidDifficultyPolicy={enabled:boolean;limit?:number;cooldownMs?:number};
export const DEFAULT_RAID_DIFFICULTY:Readonly<RaidDifficultyPolicy>={enabled:true};
export function allowsRaidDifficulty(p:RaidDifficultyPolicy,current=0,lastAt?:number,now=Date.now()){if(!p.enabled)return false;if(p.limit!==undefined&&current>=p.limit)return false;if(p.cooldownMs&&lastAt!==undefined&&now-lastAt<p.cooldownMs)return false;return true;}
