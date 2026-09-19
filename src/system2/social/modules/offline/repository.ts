/** SYSTEM Network offline/repository. Concrete extension seam; intentionally dependency-free. */
export const OFFLINE_REPOSITORY_MODULE='offline.repository' as const;
export type OfflineRepositoryContext={actorId:string;now:string};
export function isOfflineRepositoryContext(v:unknown):v is OfflineRepositoryContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
