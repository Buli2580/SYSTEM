/** SYSTEM Network reputation/limits. Concrete extension seam; intentionally dependency-free. */
export const REPUTATION_LIMITS_MODULE='reputation.limits' as const;
export type ReputationLimitsContext={actorId:string;now:string};
export function isReputationLimitsContext(v:unknown):v is ReputationLimitsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
