export type PrivacyAccessContract={actorId:string;enabled:boolean};export const validatePrivacyAccess=(v:PrivacyAccessContract)=>v.actorId.trim().length>0&&v.enabled;
