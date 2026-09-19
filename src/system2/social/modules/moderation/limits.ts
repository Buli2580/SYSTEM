/** SYSTEM Network moderation/limits. Concrete extension seam; intentionally dependency-free. */
export const MODERATION_LIMITS_MODULE='moderation.limits' as const;
export type ModerationLimitsContext={actorId:string;now:string};
export function isModerationLimitsContext(v:unknown):v is ModerationLimitsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
