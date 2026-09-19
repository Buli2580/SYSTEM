/** SYSTEM Network badge/lifecycle. Concrete extension seam; intentionally dependency-free. */
export const BADGE_LIFECYCLE_MODULE='badge.lifecycle' as const;
export type BadgeLifecycleContext={actorId:string;now:string};
export function isBadgeLifecycleContext(v:unknown):v is BadgeLifecycleContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
