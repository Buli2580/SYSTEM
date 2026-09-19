export const REWARD_JOIN_USE_CASE='reward.join' as const;
export type RewardJoinInput={actorId:string;targetId?:string};
export type RewardJoinResult={ok:true}|{ok:false;code:string};
export function validateRewardJoin(input:RewardJoinInput):RewardJoinResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
