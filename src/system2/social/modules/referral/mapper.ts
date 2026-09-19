/** SYSTEM Network referral/mapper. Concrete extension seam; intentionally dependency-free. */
export const REFERRAL_MAPPER_MODULE='referral.mapper' as const;
export type ReferralMapperContext={actorId:string;now:string};
export function isReferralMapperContext(v:unknown):v is ReferralMapperContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
