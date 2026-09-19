/** SYSTEM Network offline/serializer. Concrete extension seam; intentionally dependency-free. */
export const OFFLINE_SERIALIZER_MODULE='offline.serializer' as const;
export type OfflineSerializerContext={actorId:string;now:string};
export function isOfflineSerializerContext(v:unknown):v is OfflineSerializerContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
