export type SeasonProgressPolicy={enabled:boolean;limit?:number;cooldownMs?:number};
export const DEFAULT_SEASON_PROGRESS:Readonly<SeasonProgressPolicy>={enabled:true};
export function allowsSeasonProgress(p:SeasonProgressPolicy,current=0,lastAt?:number,now=Date.now()){if(!p.enabled)return false;if(p.limit!==undefined&&current>=p.limit)return false;if(p.cooldownMs&&lastAt!==undefined&&now-lastAt<p.cooldownMs)return false;return true;}
