export const REFERRAL_CREATE_USE_CASE='referral.create' as const;
export type ReferralCreateInput={actorId:string;targetId?:string};
export type ReferralCreateResult={ok:true}|{ok:false;code:string};
export function validateReferralCreate(input:ReferralCreateInput):ReferralCreateResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
