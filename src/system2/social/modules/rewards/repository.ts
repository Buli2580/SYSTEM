/** SYSTEM Network rewards/repository. Concrete extension seam; intentionally dependency-free. */
export const REWARDS_REPOSITORY_MODULE='rewards.repository' as const;
export type RewardsRepositoryContext={actorId:string;now:string};
export function isRewardsRepositoryContext(v:unknown):v is RewardsRepositoryContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
