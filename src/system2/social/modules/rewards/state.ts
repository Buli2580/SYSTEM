/** SYSTEM Network rewards/state. Concrete extension seam; intentionally dependency-free. */
export const REWARDS_STATE_MODULE='rewards.state' as const;
export type RewardsStateContext={actorId:string;now:string};
export function isRewardsStateContext(v:unknown):v is RewardsStateContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
