export const REFERRAL_REMOVE_USE_CASE='referral.remove' as const;
export type ReferralRemoveInput={actorId:string;targetId?:string};
export type ReferralRemoveResult={ok:true}|{ok:false;code:string};
export function validateReferralRemove(input:ReferralRemoveInput):ReferralRemoveResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
