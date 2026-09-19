/** SYSTEM Network reputation/policy. Concrete extension seam; intentionally dependency-free. */
export const REPUTATION_POLICY_MODULE='reputation.policy' as const;
export type ReputationPolicyContext={actorId:string;now:string};
export function isReputationPolicyContext(v:unknown):v is ReputationPolicyContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
