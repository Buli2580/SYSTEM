/** SYSTEM Network sync/serializer. Concrete extension seam; intentionally dependency-free. */
export const SYNC_SERIALIZER_MODULE='sync.serializer' as const;
export type SyncSerializerContext={actorId:string;now:string};
export function isSyncSerializerContext(v:unknown):v is SyncSerializerContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
