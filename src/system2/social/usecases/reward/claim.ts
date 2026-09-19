export const REWARD_CLAIM_USE_CASE='reward.claim' as const;
export type RewardClaimInput={actorId:string;targetId?:string};
export type RewardClaimResult={ok:true}|{ok:false;code:string};
export function validateRewardClaim(input:RewardClaimInput):RewardClaimResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
