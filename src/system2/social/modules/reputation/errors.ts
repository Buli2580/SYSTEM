/** SYSTEM Network reputation/errors. Concrete extension seam; intentionally dependency-free. */
export const REPUTATION_ERRORS_MODULE='reputation.errors' as const;
export type ReputationErrorsContext={actorId:string;now:string};
export function isReputationErrorsContext(v:unknown):v is ReputationErrorsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
