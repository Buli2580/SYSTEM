/** SYSTEM Network sponsor/policy. Concrete extension seam; intentionally dependency-free. */
export const SPONSOR_POLICY_MODULE='sponsor.policy' as const;
export type SponsorPolicyContext={actorId:string;now:string};
export function isSponsorPolicyContext(v:unknown):v is SponsorPolicyContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
