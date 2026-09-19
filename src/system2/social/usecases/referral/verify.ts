export const REFERRAL_VERIFY_USE_CASE='referral.verify' as const;
export type ReferralVerifyInput={actorId:string;targetId?:string};
export type ReferralVerifyResult={ok:true}|{ok:false;code:string};
export function validateReferralVerify(input:ReferralVerifyInput):ReferralVerifyResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
