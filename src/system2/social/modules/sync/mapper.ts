/** SYSTEM Network sync/mapper. Concrete extension seam; intentionally dependency-free. */
export const SYNC_MAPPER_MODULE='sync.mapper' as const;
export type SyncMapperContext={actorId:string;now:string};
export function isSyncMapperContext(v:unknown):v is SyncMapperContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
