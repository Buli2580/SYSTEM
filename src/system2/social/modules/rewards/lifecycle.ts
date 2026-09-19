/** SYSTEM Network rewards/lifecycle. Concrete extension seam; intentionally dependency-free. */
export const REWARDS_LIFECYCLE_MODULE='rewards.lifecycle' as const;
export type RewardsLifecycleContext={actorId:string;now:string};
export function isRewardsLifecycleContext(v:unknown):v is RewardsLifecycleContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
