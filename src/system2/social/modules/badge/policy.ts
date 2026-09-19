/** SYSTEM Network badge/policy. Concrete extension seam; intentionally dependency-free. */
export const BADGE_POLICY_MODULE='badge.policy' as const;
export type BadgePolicyContext={actorId:string;now:string};
export function isBadgePolicyContext(v:unknown):v is BadgePolicyContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
