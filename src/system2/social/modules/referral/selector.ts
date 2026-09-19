/** SYSTEM Network referral/selector. Concrete extension seam; intentionally dependency-free. */
export const REFERRAL_SELECTOR_MODULE='referral.selector' as const;
export type ReferralSelectorContext={actorId:string;now:string};
export function isReferralSelectorContext(v:unknown):v is ReferralSelectorContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
