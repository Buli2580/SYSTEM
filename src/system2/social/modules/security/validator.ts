/** SYSTEM Network security/validator. Concrete extension seam; intentionally dependency-free. */
export const SECURITY_VALIDATOR_MODULE='security.validator' as const;
export type SecurityValidatorContext={actorId:string;now:string};
export function isSecurityValidatorContext(v:unknown):v is SecurityValidatorContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
