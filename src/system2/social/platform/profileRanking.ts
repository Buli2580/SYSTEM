export type ProfileRankingPolicy={enabled:boolean;limit?:number;cooldownMs?:number};
export const DEFAULT_PROFILE_RANKING:Readonly<ProfileRankingPolicy>={enabled:true};
export function allowsProfileRanking(p:ProfileRankingPolicy,current=0,lastAt?:number,now=Date.now()){if(!p.enabled)return false;if(p.limit!==undefined&&current>=p.limit)return false;if(p.cooldownMs&&lastAt!==undefined&&now-lastAt<p.cooldownMs)return false;return true;}
