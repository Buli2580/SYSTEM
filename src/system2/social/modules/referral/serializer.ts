/** SYSTEM Network referral/serializer. Concrete extension seam; intentionally dependency-free. */
export const REFERRAL_SERIALIZER_MODULE='referral.serializer' as const;
export type ReferralSerializerContext={actorId:string;now:string};
export function isReferralSerializerContext(v:unknown):v is ReferralSerializerContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
