/** SYSTEM Network privacy/validator. Concrete extension seam; intentionally dependency-free. */
export const PRIVACY_VALIDATOR_MODULE='privacy.validator' as const;
export type PrivacyValidatorContext={actorId:string;now:string};
export function isPrivacyValidatorContext(v:unknown):v is PrivacyValidatorContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
