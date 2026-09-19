export const REFERRAL_READ_USE_CASE='referral.read' as const;
export type ReferralReadInput={actorId:string;targetId?:string};
export type ReferralReadResult={ok:true}|{ok:false;code:string};
export function validateReferralRead(input:ReferralReadInput):ReferralReadResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
