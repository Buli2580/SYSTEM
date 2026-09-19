/** SYSTEM Network offline/errors. Concrete extension seam; intentionally dependency-free. */
export const OFFLINE_ERRORS_MODULE='offline.errors' as const;
export type OfflineErrorsContext={actorId:string;now:string};
export function isOfflineErrorsContext(v:unknown):v is OfflineErrorsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
