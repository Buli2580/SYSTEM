/** SYSTEM Network moderation/serializer. Concrete extension seam; intentionally dependency-free. */
export const MODERATION_SERIALIZER_MODULE='moderation.serializer' as const;
export type ModerationSerializerContext={actorId:string;now:string};
export function isModerationSerializerContext(v:unknown):v is ModerationSerializerContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
