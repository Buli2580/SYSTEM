/** SYSTEM Network rival/policy. Concrete extension seam; intentionally dependency-free. */
export const RIVAL_POLICY_MODULE='rival.policy' as const;
export type RivalPolicyContext={actorId:string;now:string};
export function isRivalPolicyContext(v:unknown):v is RivalPolicyContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
