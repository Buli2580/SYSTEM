/** SYSTEM Network reputation/permissions. Concrete extension seam; intentionally dependency-free. */
export const REPUTATION_PERMISSIONS_MODULE='reputation.permissions' as const;
export type ReputationPermissionsContext={actorId:string;now:string};
export function isReputationPermissionsContext(v:unknown):v is ReputationPermissionsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
