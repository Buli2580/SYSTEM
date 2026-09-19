/** SYSTEM Network sync/permissions. Concrete extension seam; intentionally dependency-free. */
export const SYNC_PERMISSIONS_MODULE='sync.permissions' as const;
export type SyncPermissionsContext={actorId:string;now:string};
export function isSyncPermissionsContext(v:unknown):v is SyncPermissionsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
