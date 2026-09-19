export const REWARD_ACCEPT_USE_CASE='reward.accept' as const;
export type RewardAcceptInput={actorId:string;targetId?:string};
export type RewardAcceptResult={ok:true}|{ok:false;code:string};
export function validateRewardAccept(input:RewardAcceptInput):RewardAcceptResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
