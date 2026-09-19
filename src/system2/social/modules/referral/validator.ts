/** SYSTEM Network referral/validator. Concrete extension seam; intentionally dependency-free. */
export const REFERRAL_VALIDATOR_MODULE='referral.validator' as const;
export type ReferralValidatorContext={actorId:string;now:string};
export function isReferralValidatorContext(v:unknown):v is ReferralValidatorContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
