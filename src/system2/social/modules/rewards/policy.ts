/** SYSTEM Network rewards/policy. Concrete extension seam; intentionally dependency-free. */
export const REWARDS_POLICY_MODULE='rewards.policy' as const;
export type RewardsPolicyContext={actorId:string;now:string};
export function isRewardsPolicyContext(v:unknown):v is RewardsPolicyContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
