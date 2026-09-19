/** SYSTEM Network rival/validator. Concrete extension seam; intentionally dependency-free. */
export const RIVAL_VALIDATOR_MODULE='rival.validator' as const;
export type RivalValidatorContext={actorId:string;now:string};
export function isRivalValidatorContext(v:unknown):v is RivalValidatorContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
