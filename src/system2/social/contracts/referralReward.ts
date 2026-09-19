export type ReferralRewardContract={actorId:string;enabled:boolean};export const validateReferralReward=(v:ReferralRewardContract)=>v.actorId.trim().length>0&&v.enabled;
