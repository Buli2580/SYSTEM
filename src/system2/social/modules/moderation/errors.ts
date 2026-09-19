/** SYSTEM Network moderation/errors. Concrete extension seam; intentionally dependency-free. */
export const MODERATION_ERRORS_MODULE='moderation.errors' as const;
export type ModerationErrorsContext={actorId:string;now:string};
export function isModerationErrorsContext(v:unknown):v is ModerationErrorsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
