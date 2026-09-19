export type RaidRewardsContract={actorId:string;enabled:boolean};export const validateRaidRewards=(v:RaidRewardsContract)=>v.actorId.trim().length>0&&v.enabled;
