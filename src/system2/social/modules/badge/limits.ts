/** SYSTEM Network badge/limits. Concrete extension seam; intentionally dependency-free. */
export const BADGE_LIMITS_MODULE='badge.limits' as const;
export type BadgeLimitsContext={actorId:string;now:string};
export function isBadgeLimitsContext(v:unknown):v is BadgeLimitsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
