/** SYSTEM Network sync/errors. Concrete extension seam; intentionally dependency-free. */
export const SYNC_ERRORS_MODULE='sync.errors' as const;
export type SyncErrorsContext={actorId:string;now:string};
export function isSyncErrorsContext(v:unknown):v is SyncErrorsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
