/** SYSTEM Network rival/permissions. Concrete extension seam; intentionally dependency-free. */
export const RIVAL_PERMISSIONS_MODULE='rival.permissions' as const;
export type RivalPermissionsContext={actorId:string;now:string};
export function isRivalPermissionsContext(v:unknown):v is RivalPermissionsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
