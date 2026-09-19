/** SYSTEM Network rewards/types. Concrete extension seam; intentionally dependency-free. */
export const REWARDS_TYPES_MODULE='rewards.types' as const;
export type RewardsTypesContext={actorId:string;now:string};
export function isRewardsTypesContext(v:unknown):v is RewardsTypesContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
