export type RewardClaimContract={actorId:string;enabled:boolean};export const validateRewardClaim=(v:RewardClaimContract)=>v.actorId.trim().length>0&&v.enabled;
