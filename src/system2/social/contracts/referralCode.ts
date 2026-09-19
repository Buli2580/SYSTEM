export type ReferralCodeContract={actorId:string;enabled:boolean};export const validateReferralCode=(v:ReferralCodeContract)=>v.actorId.trim().length>0&&v.enabled;
