/** SYSTEM Network rival/serializer. Concrete extension seam; intentionally dependency-free. */
export const RIVAL_SERIALIZER_MODULE='rival.serializer' as const;
export type RivalSerializerContext={actorId:string;now:string};
export function isRivalSerializerContext(v:unknown):v is RivalSerializerContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
