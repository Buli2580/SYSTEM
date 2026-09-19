export const PRIVACY_REJECT_USE_CASE='privacy.reject' as const;
export type PrivacyRejectInput={actorId:string;targetId?:string};
export type PrivacyRejectResult={ok:true}|{ok:false;code:string};
export function validatePrivacyReject(input:PrivacyRejectInput):PrivacyRejectResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
