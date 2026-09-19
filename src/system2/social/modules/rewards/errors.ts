/** SYSTEM Network rewards/errors. Concrete extension seam; intentionally dependency-free. */
export const REWARDS_ERRORS_MODULE='rewards.errors' as const;
export type RewardsErrorsContext={actorId:string;now:string};
export function isRewardsErrorsContext(v:unknown):v is RewardsErrorsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
