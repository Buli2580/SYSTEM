/** SYSTEM Network raid/policy. Concrete extension seam; intentionally dependency-free. */
export const RAID_POLICY_MODULE='raid.policy' as const;
export type RaidPolicyContext={actorId:string;now:string};
export function isRaidPolicyContext(v:unknown):v is RaidPolicyContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
