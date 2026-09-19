/** SYSTEM Network moderation/eligibility. Concrete extension seam; intentionally dependency-free. */
export const MODERATION_ELIGIBILITY_MODULE='moderation.eligibility' as const;
export type ModerationEligibilityContext={actorId:string;now:string};
export function isModerationEligibilityContext(v:unknown):v is ModerationEligibilityContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
