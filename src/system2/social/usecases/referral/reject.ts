export const REFERRAL_REJECT_USE_CASE='referral.reject' as const;
export type ReferralRejectInput={actorId:string;targetId?:string};
export type ReferralRejectResult={ok:true}|{ok:false;code:string};
export function validateReferralReject(input:ReferralRejectInput):ReferralRejectResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
