export type ProfileVerificationPolicy={enabled:boolean;limit?:number;cooldownMs?:number};
export const DEFAULT_PROFILE_VERIFICATION:Readonly<ProfileVerificationPolicy>={enabled:true};
export function allowsProfileVerification(p:ProfileVerificationPolicy,current=0,lastAt?:number,now=Date.now()){if(!p.enabled)return false;if(p.limit!==undefined&&current>=p.limit)return false;if(p.cooldownMs&&lastAt!==undefined&&now-lastAt<p.cooldownMs)return false;return true;}
