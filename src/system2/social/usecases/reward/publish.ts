export const REWARD_PUBLISH_USE_CASE='reward.publish' as const;
export type RewardPublishInput={actorId:string;targetId?:string};
export type RewardPublishResult={ok:true}|{ok:false;code:string};
export function validateRewardPublish(input:RewardPublishInput):RewardPublishResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
