export type PrivacyVisibilityContract={actorId:string;enabled:boolean};export const validatePrivacyVisibility=(v:PrivacyVisibilityContract)=>v.actorId.trim().length>0&&v.enabled;
