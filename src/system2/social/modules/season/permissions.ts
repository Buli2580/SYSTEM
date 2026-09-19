/** SYSTEM Network season/permissions. Concrete extension seam; intentionally dependency-free. */
export const SEASON_PERMISSIONS_MODULE='season.permissions' as const;
export type SeasonPermissionsContext={actorId:string;now:string};
export function isSeasonPermissionsContext(v:unknown):v is SeasonPermissionsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
