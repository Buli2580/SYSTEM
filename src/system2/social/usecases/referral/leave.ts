export const REFERRAL_LEAVE_USE_CASE='referral.leave' as const;
export type ReferralLeaveInput={actorId:string;targetId?:string};
export type ReferralLeaveResult={ok:true}|{ok:false;code:string};
export function validateReferralLeave(input:ReferralLeaveInput):ReferralLeaveResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
