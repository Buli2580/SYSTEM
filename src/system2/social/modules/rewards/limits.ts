/** SYSTEM Network rewards/limits. Concrete extension seam; intentionally dependency-free. */
export const REWARDS_LIMITS_MODULE='rewards.limits' as const;
export type RewardsLimitsContext={actorId:string;now:string};
export function isRewardsLimitsContext(v:unknown):v is RewardsLimitsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
