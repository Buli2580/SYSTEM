/** SYSTEM Network referral/reducer. Concrete extension seam; intentionally dependency-free. */
export const REFERRAL_REDUCER_MODULE='referral.reducer' as const;
export type ReferralReducerContext={actorId:string;now:string};
export function isReferralReducerContext(v:unknown):v is ReferralReducerContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
