/** SYSTEM Network moderation/mapper. Concrete extension seam; intentionally dependency-free. */
export const MODERATION_MAPPER_MODULE='moderation.mapper' as const;
export type ModerationMapperContext={actorId:string;now:string};
export function isModerationMapperContext(v:unknown):v is ModerationMapperContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
