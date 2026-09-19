export type SocialRateLimitsPolicy={enabled:boolean;limit?:number;cooldownMs?:number};
export const DEFAULT_SOCIAL_RATE_LIMITS:Readonly<SocialRateLimitsPolicy>={enabled:true};
export function allowsSocialRateLimits(p:SocialRateLimitsPolicy,current=0,lastAt?:number,now=Date.now()){if(!p.enabled)return false;if(p.limit!==undefined&&current>=p.limit)return false;if(p.cooldownMs&&lastAt!==undefined&&now-lastAt<p.cooldownMs)return false;return true;}
