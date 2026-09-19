/** SYSTEM Network challenge/validator. Concrete extension seam; intentionally dependency-free. */
export const CHALLENGE_VALIDATOR_MODULE='challenge.validator' as const;
export type ChallengeValidatorContext={actorId:string;now:string};
export function isChallengeValidatorContext(v:unknown):v is ChallengeValidatorContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
