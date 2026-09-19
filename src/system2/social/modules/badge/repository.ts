/** SYSTEM Network badge/repository. Concrete extension seam; intentionally dependency-free. */
export const BADGE_REPOSITORY_MODULE='badge.repository' as const;
export type BadgeRepositoryContext={actorId:string;now:string};
export function isBadgeRepositoryContext(v:unknown):v is BadgeRepositoryContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
