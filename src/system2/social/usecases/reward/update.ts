export const REWARD_UPDATE_USE_CASE='reward.update' as const;
export type RewardUpdateInput={actorId:string;targetId?:string};
export type RewardUpdateResult={ok:true}|{ok:false;code:string};
export function validateRewardUpdate(input:RewardUpdateInput):RewardUpdateResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
