/** SYSTEM Network rewards/service. Concrete extension seam; intentionally dependency-free. */
export const REWARDS_SERVICE_MODULE='rewards.service' as const;
export type RewardsServiceContext={actorId:string;now:string};
export function isRewardsServiceContext(v:unknown):v is RewardsServiceContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
