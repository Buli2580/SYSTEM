/** SYSTEM Network privacy/serializer. Concrete extension seam; intentionally dependency-free. */
export const PRIVACY_SERIALIZER_MODULE='privacy.serializer' as const;
export type PrivacySerializerContext={actorId:string;now:string};
export function isPrivacySerializerContext(v:unknown):v is PrivacySerializerContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
