/** SYSTEM Network badge/queries. Concrete extension seam; intentionally dependency-free. */
export const BADGE_QUERIES_MODULE='badge.queries' as const;
export type BadgeQueriesContext={actorId:string;now:string};
export function isBadgeQueriesContext(v:unknown):v is BadgeQueriesContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
