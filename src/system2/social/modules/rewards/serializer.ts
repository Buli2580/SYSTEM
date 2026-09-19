/** SYSTEM Network rewards/serializer. Concrete extension seam; intentionally dependency-free. */
export const REWARDS_SERIALIZER_MODULE='rewards.serializer' as const;
export type RewardsSerializerContext={actorId:string;now:string};
export function isRewardsSerializerContext(v:unknown):v is RewardsSerializerContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
