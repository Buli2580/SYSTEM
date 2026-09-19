/** SYSTEM Network matchmaking/permissions. Concrete extension seam; intentionally dependency-free. */
export const MATCHMAKING_PERMISSIONS_MODULE='matchmaking.permissions' as const;
export type MatchmakingPermissionsContext={actorId:string;now:string};
export function isMatchmakingPermissionsContext(v:unknown):v is MatchmakingPermissionsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
