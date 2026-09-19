/** SYSTEM Network sponsor/validator. Concrete extension seam; intentionally dependency-free. */
export const SPONSOR_VALIDATOR_MODULE='sponsor.validator' as const;
export type SponsorValidatorContext={actorId:string;now:string};
export function isSponsorValidatorContext(v:unknown):v is SponsorValidatorContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
