export const REFERRAL_PUBLISH_USE_CASE='referral.publish' as const;
export type ReferralPublishInput={actorId:string;targetId?:string};
export type ReferralPublishResult={ok:true}|{ok:false;code:string};
export function validateReferralPublish(input:ReferralPublishInput):ReferralPublishResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
