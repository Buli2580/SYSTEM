/** SYSTEM Network moderation/validator. Concrete extension seam; intentionally dependency-free. */
export const MODERATION_VALIDATOR_MODULE='moderation.validator' as const;
export type ModerationValidatorContext={actorId:string;now:string};
export function isModerationValidatorContext(v:unknown):v is ModerationValidatorContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
