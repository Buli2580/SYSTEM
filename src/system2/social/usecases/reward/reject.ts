export const REWARD_REJECT_USE_CASE='reward.reject' as const;
export type RewardRejectInput={actorId:string;targetId?:string};
export type RewardRejectResult={ok:true}|{ok:false;code:string};
export function validateRewardReject(input:RewardRejectInput):RewardRejectResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
