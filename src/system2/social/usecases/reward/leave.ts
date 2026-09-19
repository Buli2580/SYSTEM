export const REWARD_LEAVE_USE_CASE='reward.leave' as const;
export type RewardLeaveInput={actorId:string;targetId?:string};
export type RewardLeaveResult={ok:true}|{ok:false;code:string};
export function validateRewardLeave(input:RewardLeaveInput):RewardLeaveResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
