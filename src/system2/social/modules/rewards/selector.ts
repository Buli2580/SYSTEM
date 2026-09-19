/** SYSTEM Network rewards/selector. Concrete extension seam; intentionally dependency-free. */
export const REWARDS_SELECTOR_MODULE='rewards.selector' as const;
export type RewardsSelectorContext={actorId:string;now:string};
export function isRewardsSelectorContext(v:unknown):v is RewardsSelectorContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
