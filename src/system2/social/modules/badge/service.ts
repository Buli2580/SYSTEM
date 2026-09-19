/** SYSTEM Network badge/service. Concrete extension seam; intentionally dependency-free. */
export const BADGE_SERVICE_MODULE='badge.service' as const;
export type BadgeServiceContext={actorId:string;now:string};
export function isBadgeServiceContext(v:unknown):v is BadgeServiceContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
