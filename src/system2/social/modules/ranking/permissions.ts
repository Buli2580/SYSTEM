/** SYSTEM Network ranking/permissions. Concrete extension seam; intentionally dependency-free. */
export const RANKING_PERMISSIONS_MODULE='ranking.permissions' as const;
export type RankingPermissionsContext={actorId:string;now:string};
export function isRankingPermissionsContext(v:unknown):v is RankingPermissionsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
