export type RewardAccessContract={actorId:string;enabled:boolean};export const validateRewardAccess=(v:RewardAccessContract)=>v.actorId.trim().length>0&&v.enabled;
