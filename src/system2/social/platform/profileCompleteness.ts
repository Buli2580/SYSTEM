export type ProfileCompletenessPolicy={enabled:boolean;limit?:number;cooldownMs?:number};
export const DEFAULT_PROFILE_COMPLETENESS:Readonly<ProfileCompletenessPolicy>={enabled:true};
export function allowsProfileCompleteness(p:ProfileCompletenessPolicy,current=0,lastAt?:number,now=Date.now()){if(!p.enabled)return false;if(p.limit!==undefined&&current>=p.limit)return false;if(p.cooldownMs&&lastAt!==undefined&&now-lastAt<p.cooldownMs)return false;return true;}
