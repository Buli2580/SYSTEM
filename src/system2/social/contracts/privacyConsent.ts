export type PrivacyConsentContract={actorId:string;enabled:boolean};export const validatePrivacyConsent=(v:PrivacyConsentContract)=>v.actorId.trim().length>0&&v.enabled;
