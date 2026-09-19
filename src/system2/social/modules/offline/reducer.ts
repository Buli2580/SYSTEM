/** SYSTEM Network offline/reducer. Concrete extension seam; intentionally dependency-free. */
export const OFFLINE_REDUCER_MODULE='offline.reducer' as const;
export type OfflineReducerContext={actorId:string;now:string};
export function isOfflineReducerContext(v:unknown):v is OfflineReducerContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
