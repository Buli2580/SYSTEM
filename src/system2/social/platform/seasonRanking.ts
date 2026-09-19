export type SeasonRankingPolicy={enabled:boolean;limit?:number;cooldownMs?:number};
export const DEFAULT_SEASON_RANKING:Readonly<SeasonRankingPolicy>={enabled:true};
export function allowsSeasonRanking(p:SeasonRankingPolicy,current=0,lastAt?:number,now=Date.now()){if(!p.enabled)return false;if(p.limit!==undefined&&current>=p.limit)return false;if(p.cooldownMs&&lastAt!==undefined&&now-lastAt<p.cooldownMs)return false;return true;}
