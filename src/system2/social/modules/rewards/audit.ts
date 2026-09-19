/** SYSTEM Network rewards/audit. Concrete extension seam; intentionally dependency-free. */
export const REWARDS_AUDIT_MODULE='rewards.audit' as const;
export type RewardsAuditContext={actorId:string;now:string};
export function isRewardsAuditContext(v:unknown):v is RewardsAuditContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
