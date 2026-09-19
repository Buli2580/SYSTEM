/** SYSTEM Network rewards/commands. Concrete extension seam; intentionally dependency-free. */
export const REWARDS_COMMANDS_MODULE='rewards.commands' as const;
export type RewardsCommandsContext={actorId:string;now:string};
export function isRewardsCommandsContext(v:unknown):v is RewardsCommandsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
