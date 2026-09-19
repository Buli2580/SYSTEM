/** SYSTEM Network rewards/events. Concrete extension seam; intentionally dependency-free. */
export const REWARDS_EVENTS_MODULE='rewards.events' as const;
export type RewardsEventsContext={actorId:string;now:string};
export function isRewardsEventsContext(v:unknown):v is RewardsEventsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
