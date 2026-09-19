/** SYSTEM Network presence/validator. Concrete extension seam; intentionally dependency-free. */
export const PRESENCE_VALIDATOR_MODULE='presence.validator' as const;
export type PresenceValidatorContext={actorId:string;now:string};
export function isPresenceValidatorContext(v:unknown):v is PresenceValidatorContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
