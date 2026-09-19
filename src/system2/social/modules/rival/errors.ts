/** SYSTEM Network rival/errors. Concrete extension seam; intentionally dependency-free. */
export const RIVAL_ERRORS_MODULE='rival.errors' as const;
export type RivalErrorsContext={actorId:string;now:string};
export function isRivalErrorsContext(v:unknown):v is RivalErrorsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
