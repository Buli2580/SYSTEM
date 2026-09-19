/** SYSTEM Network sync/service. Concrete extension seam; intentionally dependency-free. */
export const SYNC_SERVICE_MODULE='sync.service' as const;
export type SyncServiceContext={actorId:string;now:string};
export function isSyncServiceContext(v:unknown):v is SyncServiceContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
