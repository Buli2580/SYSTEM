/** SYSTEM Network sync/repository. Concrete extension seam; intentionally dependency-free. */
export const SYNC_REPOSITORY_MODULE='sync.repository' as const;
export type SyncRepositoryContext={actorId:string;now:string};
export function isSyncRepositoryContext(v:unknown):v is SyncRepositoryContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
