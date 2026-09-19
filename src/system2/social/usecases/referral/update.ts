export const REFERRAL_UPDATE_USE_CASE='referral.update' as const;
export type ReferralUpdateInput={actorId:string;targetId?:string};
export type ReferralUpdateResult={ok:true}|{ok:false;code:string};
export function validateReferralUpdate(input:ReferralUpdateInput):ReferralUpdateResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
