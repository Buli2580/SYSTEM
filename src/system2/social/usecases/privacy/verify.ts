export const PRIVACY_VERIFY_USE_CASE='privacy.verify' as const;
export type PrivacyVerifyInput={actorId:string;targetId?:string};
export type PrivacyVerifyResult={ok:true}|{ok:false;code:string};
export function validatePrivacyVerify(input:PrivacyVerifyInput):PrivacyVerifyResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
