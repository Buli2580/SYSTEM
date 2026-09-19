/** SYSTEM Network badge/mapper. Concrete extension seam; intentionally dependency-free. */
export const BADGE_MAPPER_MODULE='badge.mapper' as const;
export type BadgeMapperContext={actorId:string;now:string};
export function isBadgeMapperContext(v:unknown):v is BadgeMapperContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
