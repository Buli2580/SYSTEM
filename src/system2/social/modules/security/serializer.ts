/** SYSTEM Network security/serializer. Concrete extension seam; intentionally dependency-free. */
export const SECURITY_SERIALIZER_MODULE='security.serializer' as const;
export type SecuritySerializerContext={actorId:string;now:string};
export function isSecuritySerializerContext(v:unknown):v is SecuritySerializerContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
