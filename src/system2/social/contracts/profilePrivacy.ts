export type ProfilePrivacyContract={actorId:string;enabled:boolean};export const validateProfilePrivacy=(v:ProfilePrivacyContract)=>v.actorId.trim().length>0&&v.enabled;
