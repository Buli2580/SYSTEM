/** SYSTEM Network badge/errors. Concrete extension seam; intentionally dependency-free. */
export const BADGE_ERRORS_MODULE='badge.errors' as const;
export type BadgeErrorsContext={actorId:string;now:string};
export function isBadgeErrorsContext(v:unknown):v is BadgeErrorsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
