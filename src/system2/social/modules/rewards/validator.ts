/** SYSTEM Network rewards/validator. Concrete extension seam; intentionally dependency-free. */
export const REWARDS_VALIDATOR_MODULE='rewards.validator' as const;
export type RewardsValidatorContext={actorId:string;now:string};
export function isRewardsValidatorContext(v:unknown):v is RewardsValidatorContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
