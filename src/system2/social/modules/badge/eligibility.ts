/** SYSTEM Network badge/eligibility. Concrete extension seam; intentionally dependency-free. */
export const BADGE_ELIGIBILITY_MODULE='badge.eligibility' as const;
export type BadgeEligibilityContext={actorId:string;now:string};
export function isBadgeEligibilityContext(v:unknown):v is BadgeEligibilityContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
