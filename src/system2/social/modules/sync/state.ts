/** SYSTEM Network sync/state. Concrete extension seam; intentionally dependency-free. */
export const SYNC_STATE_MODULE='sync.state' as const;
export type SyncStateContext={actorId:string;now:string};
export function isSyncStateContext(v:unknown):v is SyncStateContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
