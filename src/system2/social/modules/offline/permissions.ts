/** SYSTEM Network offline/permissions. Concrete extension seam; intentionally dependency-free. */
export const OFFLINE_PERMISSIONS_MODULE='offline.permissions' as const;
export type OfflinePermissionsContext={actorId:string;now:string};
export function isOfflinePermissionsContext(v:unknown):v is OfflinePermissionsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
