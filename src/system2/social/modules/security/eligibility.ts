/** SYSTEM Network security/eligibility. Concrete extension seam; intentionally dependency-free. */
export const SECURITY_ELIGIBILITY_MODULE='security.eligibility' as const;
export type SecurityEligibilityContext={actorId:string;now:string};
export function isSecurityEligibilityContext(v:unknown):v is SecurityEligibilityContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
