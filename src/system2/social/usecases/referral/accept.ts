export const REFERRAL_ACCEPT_USE_CASE='referral.accept' as const;
export type ReferralAcceptInput={actorId:string;targetId?:string};
export type ReferralAcceptResult={ok:true}|{ok:false;code:string};
export function validateReferralAccept(input:ReferralAcceptInput):ReferralAcceptResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
