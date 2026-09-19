/** SYSTEM Network badge/types. Concrete extension seam; intentionally dependency-free. */
export const BADGE_TYPES_MODULE='badge.types' as const;
export type BadgeTypesContext={actorId:string;now:string};
export function isBadgeTypesContext(v:unknown):v is BadgeTypesContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
