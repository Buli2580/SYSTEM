export const REFERRAL_JOIN_USE_CASE='referral.join' as const;
export type ReferralJoinInput={actorId:string;targetId?:string};
export type ReferralJoinResult={ok:true}|{ok:false;code:string};
export function validateReferralJoin(input:ReferralJoinInput):ReferralJoinResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
