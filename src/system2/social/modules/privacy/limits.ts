/** SYSTEM Network privacy/limits. Concrete extension seam; intentionally dependency-free. */
export const PRIVACY_LIMITS_MODULE='privacy.limits' as const;
export type PrivacyLimitsContext={actorId:string;now:string};
export function isPrivacyLimitsContext(v:unknown):v is PrivacyLimitsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
