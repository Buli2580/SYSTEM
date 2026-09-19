export const REWARD_REMOVE_USE_CASE='reward.remove' as const;
export type RewardRemoveInput={actorId:string;targetId?:string};
export type RewardRemoveResult={ok:true}|{ok:false;code:string};
export function validateRewardRemove(input:RewardRemoveInput):RewardRemoveResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
