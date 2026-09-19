/** SYSTEM Network rewards/permissions. Concrete extension seam; intentionally dependency-free. */
export const REWARDS_PERMISSIONS_MODULE='rewards.permissions' as const;
export type RewardsPermissionsContext={actorId:string;now:string};
export function isRewardsPermissionsContext(v:unknown):v is RewardsPermissionsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
