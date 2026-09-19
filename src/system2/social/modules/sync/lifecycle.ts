/** SYSTEM Network sync/lifecycle. Concrete extension seam; intentionally dependency-free. */
export const SYNC_LIFECYCLE_MODULE='sync.lifecycle' as const;
export type SyncLifecycleContext={actorId:string;now:string};
export function isSyncLifecycleContext(v:unknown):v is SyncLifecycleContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
