/** SYSTEM Network badge/permissions. Concrete extension seam; intentionally dependency-free. */
export const BADGE_PERMISSIONS_MODULE='badge.permissions' as const;
export type BadgePermissionsContext={actorId:string;now:string};
export function isBadgePermissionsContext(v:unknown):v is BadgePermissionsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
