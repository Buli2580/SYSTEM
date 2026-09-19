/** SYSTEM Network challenge/policy. Concrete extension seam; intentionally dependency-free. */
export const CHALLENGE_POLICY_MODULE='challenge.policy' as const;
export type ChallengePolicyContext={actorId:string;now:string};
export function isChallengePolicyContext(v:unknown):v is ChallengePolicyContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
