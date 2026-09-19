/** SYSTEM Network rewards/queries. Concrete extension seam; intentionally dependency-free. */
export const REWARDS_QUERIES_MODULE='rewards.queries' as const;
export type RewardsQueriesContext={actorId:string;now:string};
export function isRewardsQueriesContext(v:unknown):v is RewardsQueriesContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
