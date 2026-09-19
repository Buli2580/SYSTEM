/** SYSTEM Network rewards/eligibility. Concrete extension seam; intentionally dependency-free. */
export const REWARDS_ELIGIBILITY_MODULE='rewards.eligibility' as const;
export type RewardsEligibilityContext={actorId:string;now:string};
export function isRewardsEligibilityContext(v:unknown):v is RewardsEligibilityContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
