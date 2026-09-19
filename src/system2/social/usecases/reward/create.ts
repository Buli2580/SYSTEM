export const REWARD_CREATE_USE_CASE='reward.create' as const;
export type RewardCreateInput={actorId:string;targetId?:string};
export type RewardCreateResult={ok:true}|{ok:false;code:string};
export function validateRewardCreate(input:RewardCreateInput):RewardCreateResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
