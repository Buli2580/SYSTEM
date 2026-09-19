/** SYSTEM Network rewards/reducer. Concrete extension seam; intentionally dependency-free. */
export const REWARDS_REDUCER_MODULE='rewards.reducer' as const;
export type RewardsReducerContext={actorId:string;now:string};
export function isRewardsReducerContext(v:unknown):v is RewardsReducerContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
