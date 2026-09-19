export const REWARD_VERIFY_USE_CASE='reward.verify' as const;
export type RewardVerifyInput={actorId:string;targetId?:string};
export type RewardVerifyResult={ok:true}|{ok:false;code:string};
export function validateRewardVerify(input:RewardVerifyInput):RewardVerifyResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
