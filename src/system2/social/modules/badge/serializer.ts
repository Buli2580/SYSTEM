/** SYSTEM Network badge/serializer. Concrete extension seam; intentionally dependency-free. */
export const BADGE_SERIALIZER_MODULE='badge.serializer' as const;
export type BadgeSerializerContext={actorId:string;now:string};
export function isBadgeSerializerContext(v:unknown):v is BadgeSerializerContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
