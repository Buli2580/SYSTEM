/** SYSTEM Network privacy/policy. Concrete extension seam; intentionally dependency-free. */
export const PRIVACY_POLICY_MODULE='privacy.policy' as const;
export type PrivacyPolicyContext={actorId:string;now:string};
export function isPrivacyPolicyContext(v:unknown):v is PrivacyPolicyContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
