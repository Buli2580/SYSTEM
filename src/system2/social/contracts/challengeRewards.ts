export type ChallengeRewardsContract={actorId:string;enabled:boolean};export const validateChallengeRewards=(v:ChallengeRewardsContract)=>v.actorId.trim().length>0&&v.enabled;
