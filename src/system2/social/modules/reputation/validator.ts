/** SYSTEM Network reputation/validator. Concrete extension seam; intentionally dependency-free. */
export const REPUTATION_VALIDATOR_MODULE='reputation.validator' as const;
export type ReputationValidatorContext={actorId:string;now:string};
export function isReputationValidatorContext(v:unknown):v is ReputationValidatorContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
