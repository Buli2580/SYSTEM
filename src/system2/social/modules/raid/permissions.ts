/** SYSTEM Network raid/permissions. Concrete extension seam; intentionally dependency-free. */
export const RAID_PERMISSIONS_MODULE='raid.permissions' as const;
export type RaidPermissionsContext={actorId:string;now:string};
export function isRaidPermissionsContext(v:unknown):v is RaidPermissionsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
