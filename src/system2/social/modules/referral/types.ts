/** SYSTEM Network referral/types. Concrete extension seam; intentionally dependency-free. */
export const REFERRAL_TYPES_MODULE='referral.types' as const;
export type ReferralTypesContext={actorId:string;now:string};
export function isReferralTypesContext(v:unknown):v is ReferralTypesContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
