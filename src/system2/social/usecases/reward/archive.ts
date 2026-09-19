export const REWARD_ARCHIVE_USE_CASE='reward.archive' as const;
export type RewardArchiveInput={actorId:string;targetId?:string};
export type RewardArchiveResult={ok:true}|{ok:false;code:string};
export function validateRewardArchive(input:RewardArchiveInput):RewardArchiveResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
