/** SYSTEM Network sync/validator. Concrete extension seam; intentionally dependency-free. */
export const SYNC_VALIDATOR_MODULE='sync.validator' as const;
export type SyncValidatorContext={actorId:string;now:string};
export function isSyncValidatorContext(v:unknown):v is SyncValidatorContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
