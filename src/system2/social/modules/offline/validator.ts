/** SYSTEM Network offline/validator. Concrete extension seam; intentionally dependency-free. */
export const OFFLINE_VALIDATOR_MODULE='offline.validator' as const;
export type OfflineValidatorContext={actorId:string;now:string};
export function isOfflineValidatorContext(v:unknown):v is OfflineValidatorContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
