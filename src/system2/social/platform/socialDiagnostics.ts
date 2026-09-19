export type SocialDiagnosticsPolicy={enabled:boolean;limit?:number;cooldownMs?:number};
export const DEFAULT_SOCIAL_DIAGNOSTICS:Readonly<SocialDiagnosticsPolicy>={enabled:true};
export function allowsSocialDiagnostics(p:SocialDiagnosticsPolicy,current=0,lastAt?:number,now=Date.now()){if(!p.enabled)return false;if(p.limit!==undefined&&current>=p.limit)return false;if(p.cooldownMs&&lastAt!==undefined&&now-lastAt<p.cooldownMs)return false;return true;}
