/** SYSTEM Network reputation/serializer. Concrete extension seam; intentionally dependency-free. */
export const REPUTATION_SERIALIZER_MODULE='reputation.serializer' as const;
export type ReputationSerializerContext={actorId:string;now:string};
export function isReputationSerializerContext(v:unknown):v is ReputationSerializerContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
