/** SYSTEM Network cache/permissions. Concrete extension seam; intentionally dependency-free. */
export const CACHE_PERMISSIONS_MODULE='cache.permissions' as const;
export type CachePermissionsContext={actorId:string;now:string};
export function isCachePermissionsContext(v:unknown):v is CachePermissionsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
