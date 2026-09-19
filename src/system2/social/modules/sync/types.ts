/** SYSTEM Network sync/types. Concrete extension seam; intentionally dependency-free. */
export const SYNC_TYPES_MODULE='sync.types' as const;
export type SyncTypesContext={actorId:string;now:string};
export function isSyncTypesContext(v:unknown):v is SyncTypesContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
