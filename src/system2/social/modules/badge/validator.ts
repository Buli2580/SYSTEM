/** SYSTEM Network badge/validator. Concrete extension seam; intentionally dependency-free. */
export const BADGE_VALIDATOR_MODULE='badge.validator' as const;
export type BadgeValidatorContext={actorId:string;now:string};
export function isBadgeValidatorContext(v:unknown):v is BadgeValidatorContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
