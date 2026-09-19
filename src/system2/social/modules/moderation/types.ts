/** SYSTEM Network moderation/types. Concrete extension seam; intentionally dependency-free. */
export const MODERATION_TYPES_MODULE='moderation.types' as const;
export type ModerationTypesContext={actorId:string;now:string};
export function isModerationTypesContext(v:unknown):v is ModerationTypesContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
