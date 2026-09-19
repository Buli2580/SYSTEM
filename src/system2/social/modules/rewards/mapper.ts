/** SYSTEM Network rewards/mapper. Concrete extension seam; intentionally dependency-free. */
export const REWARDS_MAPPER_MODULE='rewards.mapper' as const;
export type RewardsMapperContext={actorId:string;now:string};
export function isRewardsMapperContext(v:unknown):v is RewardsMapperContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
