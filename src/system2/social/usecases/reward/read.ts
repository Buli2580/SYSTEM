export const REWARD_READ_USE_CASE='reward.read' as const;
export type RewardReadInput={actorId:string;targetId?:string};
export type RewardReadResult={ok:true}|{ok:false;code:string};
export function validateRewardRead(input:RewardReadInput):RewardReadResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
