export type ReferralAccessContract={actorId:string;enabled:boolean};export const validateReferralAccess=(v:ReferralAccessContract)=>v.actorId.trim().length>0&&v.enabled;
