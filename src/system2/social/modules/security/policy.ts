/** SYSTEM Network security/policy. Concrete extension seam; intentionally dependency-free. */
export const SECURITY_POLICY_MODULE='security.policy' as const;
export type SecurityPolicyContext={actorId:string;now:string};
export function isSecurityPolicyContext(v:unknown):v is SecurityPolicyContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
