/** SYSTEM Network discovery/permissions. Concrete extension seam; intentionally dependency-free. */
export const DISCOVERY_PERMISSIONS_MODULE='discovery.permissions' as const;
export type DiscoveryPermissionsContext={actorId:string;now:string};
export function isDiscoveryPermissionsContext(v:unknown):v is DiscoveryPermissionsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
