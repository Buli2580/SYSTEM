/** SYSTEM Network presence/permissions. Concrete extension seam; intentionally dependency-free. */
export const PRESENCE_PERMISSIONS_MODULE='presence.permissions' as const;
export type PresencePermissionsContext={actorId:string;now:string};
export function isPresencePermissionsContext(v:unknown):v is PresencePermissionsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
