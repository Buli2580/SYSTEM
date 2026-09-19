/** SYSTEM Network cache/repository. Concrete extension seam; intentionally dependency-free. */
export const CACHE_REPOSITORY_MODULE='cache.repository' as const;
export type CacheRepositoryContext={actorId:string;now:string};
export function isCacheRepositoryContext(v:unknown):v is CacheRepositoryContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
