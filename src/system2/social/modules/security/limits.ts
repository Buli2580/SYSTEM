/** SYSTEM Network security/limits. Concrete extension seam; intentionally dependency-free. */
export const SECURITY_LIMITS_MODULE='security.limits' as const;
export type SecurityLimitsContext={actorId:string;now:string};
export function isSecurityLimitsContext(v:unknown):v is SecurityLimitsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
